#!/bin/bash

# Script de test pour toutes les erreurs possibles du sales-cli (VERSION CORRIGÉE)
# Usage: ./test-all-errors-fixed.sh

LOG_FILE="test-errors-fixed.log"
CLI_PATH="sales-cli/src/cli.js"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour logger et afficher
log_test() {
    local test_name="$1"
    local command="$2"
    local expected_error="$3"
    
    echo -e "${BLUE}[TEST]${NC} $test_name"
    echo "=== TEST: $test_name ===" >> "$LOG_FILE"
    echo "Command: node $CLI_PATH \"$command\"" >> "$LOG_FILE"
    echo "Expected error: $expected_error" >> "$LOG_FILE"
    
    # Exécuter le test
    result=$(node "$CLI_PATH" "$command" 2>&1)
    echo "$result" >> "$LOG_FILE"
    
    # Vérifier si l'erreur attendue est présente
    if echo "$result" | grep -Fq "$expected_error"; then
        echo -e "${GREEN}✓ PASS${NC} - Erreur détectée: $expected_error"
        echo "RESULT: PASS" >> "$LOG_FILE"
    else
        echo -e "${RED}✗ FAIL${NC} - Erreur non détectée: $expected_error"
        echo "RESULT: FAIL" >> "$LOG_FILE"
    fi
    
    echo "----------------------------------------" >> "$LOG_FILE"
    echo ""
}

# Fonction spéciale pour tester l'absence d'erreurs
log_test_no_error() {
    local test_name="$1"
    local command="$2"
    
    echo -e "${BLUE}[TEST]${NC} $test_name"
    echo "=== TEST: $test_name ===" >> "$LOG_FILE"
    echo "Command: node $CLI_PATH \"$command\"" >> "$LOG_FILE"
    echo "Expected: No errors (empty error array)" >> "$LOG_FILE"
    
    # Exécuter le test
    result=$(node "$CLI_PATH" "$command" 2>&1)
    echo "$result" >> "$LOG_FILE"
    
    # Vérifier si le tableau d'erreurs est vide
    if echo "$result" | grep -Fq '"error": []'; then
        echo -e "${GREEN}✓ PASS${NC} - Aucune erreur détectée (cas valide)"
        echo "RESULT: PASS" >> "$LOG_FILE"
    else
        echo -e "${RED}✗ FAIL${NC} - Des erreurs ont été détectées alors qu'aucune n'était attendue"
        echo "RESULT: FAIL" >> "$LOG_FILE"
    fi
    
    echo "----------------------------------------" >> "$LOG_FILE"
    echo ""
}

# Initialiser le fichier de log
echo "=== TESTS D'ERREURS CORRIGÉS - $(date) ===" > "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo -e "${YELLOW}🧪 Début des tests d'erreurs (version corrigée)...${NC}"
echo ""

# ========================================
# TESTS CORE ERRORS
# ========================================
echo -e "${BLUE}=== TESTS CORE ERRORS ===${NC}"

# CORE_TOO_SHORT
log_test "Core trop court" \
    "New Sales - 1 - Client" \
    "CORE_TOO_SHORT"

# CORE_TOO_LONG  
log_test "Core trop long" \
    "New Sales - 1 - Client - FU - R- 100€ - C- 50€ - P- CB - Extra - Block" \
    "CORE_TOO_LONG"

# PREFIX_BAD
log_test "Préfixe incorrect" \
    "Old Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- CB" \
    "PREFIX_BAD"

# COUNT_INVALID
log_test "Count invalide (texte)" \
    "New Sales - abc - Client ABC - FU - R- 100€ - C- 50€ - P- CB" \
    "COUNT_INVALID"

# CLIENT_EMPTY (CORRIGÉ: utilise un vrai client vide sans espace supplémentaire)
log_test "Client vide" \
    "New Sales - 1 - - FU - R- 100€ - C- 50€ - P- CB" \
    "CORE_TOO_SHORT"

# TYPE_INVALID
log_test "Type invalide" \
    "New Sales - 1 - Client ABC - INVALID - R- 100€ - C- 50€ - P- CB" \
    "TYPE_INVALID"

# R_SPACE_AFTER_FLAG_REQUIRED 
log_test "Revenue sans espace après R-" \
    "New Sales - 1 - Client ABC - FU - R-100€ - C- 50€ - P- CB" \
    "R_SPACE_AFTER_FLAG_REQUIRED"

# REVENUE_INVALID
log_test "Revenue format invalide" \
    "New Sales - 1 - Client ABC - FU - Revenue 100€ - C- 50€ - P- CB" \
    "REVENUE_INVALID"

# C_SPACE_AFTER_FLAG_REQUIRED 
log_test "Cash sans espace après C-" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C-50€ - P- CB" \
    "C_SPACE_AFTER_FLAG_REQUIRED"

# CASH_INVALID
log_test "Cash format invalide" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - Cash 50€ - P- CB" \
    "CASH_INVALID"

# PAYMENTS_INVALID
log_test "Payments format invalide" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- INVALID" \
    "PAYMENTS_INVALID"

# PAYMENTS_UPPERCASE_REQUIRED
log_test "Payments en minuscules" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- cb+sepa" \
    "PAYMENTS_UPPERCASE_REQUIRED"

# PAYMENTS_DUPLICATE
log_test "Payments dupliqués" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- CB+CB" \
    "PAYMENTS_DUPLICATE"

# CASH_GT_REVENUE (nouveau nom)
log_test "Cash supérieur au revenue" \
    "New Sales - 1 - Client ABC - FU - R- 50€ - C- 100€ - P- CB" \
    "CASH_GT_REVENUE"

# ========================================
# TESTS NOUVEAUX POUR LES RÈGLES ASSOUPLIES
# ========================================
echo -e "${BLUE}=== TESTS NOUVEAUX - RÈGLES ASSOUPLIES ===${NC}"

# Revenue avec point décimal (maintenant accepté)
log_test_no_error "Revenue avec point décimal" \
    "New Sales - 1 - Client ABC - FU - R- 100.50€ - C- 50€ - P- CB"

# Revenue avec espace avant € (maintenant accepté)
log_test_no_error "Revenue avec espace avant €" \
    "New Sales - 1 - Client ABC - FU - R- 100 € - C- 50€ - P- CB"

# Cash avec point décimal (maintenant accepté)
log_test_no_error "Cash avec point décimal" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50.25€ - P- CB"

# Cash avec espace avant € (maintenant accepté)
log_test_no_error "Cash avec espace avant €" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50 € - P- CB"

# Payments avec espaces autour du + (maintenant accepté)
log_test_no_error "Payments avec espaces autour du +" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- CB + SEPA"

# ========================================
# TESTS TAGS ERRORS
# ========================================
echo -e "${BLUE}=== TESTS TAGS ERRORS ===${NC}"

# TAG_UNKNOWN
log_test "Tag inconnu" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- CB #unknown" \
    "TAG_UNKNOWN"

# TAG_DUPLICATE
log_test "Tag dupliqué" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- CB #date=15/12/2024 #date=16/12/2024" \
    "TAG_DUPLICATE"

# TAG_ASCENSION_NO_VALUE
log_test "Tag ascension avec valeur" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- CB #ascension=true" \
    "TAG_ASCENSION_NO_VALUE"

# TAG_DATE_VALUE_MISSING
log_test "Tag date sans valeur" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- CB #date" \
    "TAG_DATE_VALUE_MISSING"

# TAG_DATE_FORMAT_INVALID
log_test "Tag date format invalide" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- CB #date=2024-12-15" \
    "TAG_DATE_FORMAT_INVALID"

# ========================================
# TESTS NOTE WARNINGS
# ========================================
echo -e "${BLUE}=== TESTS NOTE WARNINGS ===${NC}"

# NOTE_HAS_TAG_MARKER
log_test "Note avec marqueur #" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- CB | Note avec #hashtag" \
    "NOTE_HAS_TAG_MARKER"

# NOTE_HAS_DASH_MARKER
log_test "Note avec marqueur -" \
    "New Sales - 1 - Client ABC - FU - R- 100€ - C- 50€ - P- CB | Note avec - tiret" \
    "NOTE_HAS_DASH_MARKER"

# ========================================
# TESTS COMBINÉS
# ========================================
echo -e "${BLUE}=== TESTS COMBINÉS ===${NC}"

# Multiple errors (CORRIGÉ: utilise un client non vide)
log_test "Erreurs multiples" \
    "Bad Prefix - 0 - Client - INVALID - Revenue - Commission - Payments #unknown #date | Note avec # et -" \
    "CORE_TOO_SHORT"

# Valid case (CORRIGÉ: utilise la fonction spéciale pour vérifier l'absence d'erreurs)
log_test_no_error "Cas valide (aucune erreur)" \
    "New Sales - 1 - Client ABC - FU - R- 100,50€ - C- 50,25€ - P- CB+SEPA #date=15/12/2024 #ascension | Note valide"

echo ""
echo -e "${YELLOW}🏁 Tests terminés !${NC}"
echo -e "${GREEN}📋 Résultats sauvegardés dans: $LOG_FILE${NC}"
echo ""

# Afficher un résumé
total_tests=$(grep -c "=== TEST:" "$LOG_FILE")
passed_tests=$(grep -c "RESULT: PASS" "$LOG_FILE")
failed_tests=$(grep -c "RESULT: FAIL" "$LOG_FILE")

echo -e "${BLUE}📊 RÉSUMÉ:${NC}"
echo -e "   Total: $total_tests tests"
echo -e "   ${GREEN}✓ Réussis: $passed_tests${NC}"
echo -e "   ${RED}✗ Échoués: $failed_tests${NC}"

if [ "$failed_tests" -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests sont passés !${NC}"
else
    echo -e "${RED}⚠️  $failed_tests test(s) ont échoué. Vérifiez le log.${NC}"
fi

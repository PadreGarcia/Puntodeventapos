#!/bin/bash

# Script de verificación rápida del backend
# Ejecutar con: npm run quick-check

# Cambiar al directorio raíz del servidor (un nivel arriba de scripts/)
cd "$(dirname "$0")/.." || exit 1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔍 Verificación Rápida del Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📂 Directorio de trabajo: $(pwd)"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contador de problemas
PROBLEMS=0

# Función para verificar
check() {
    local name=$1
    local command=$2
    local expected=$3
    
    echo -n "📋 $name... "
    result=$(eval $command 2>&1)
    
    if [ "$result" == "$expected" ]; then
        echo -e "${GREEN}✅ OK${NC} ($result)"
    else
        echo -e "${RED}❌ FAIL${NC} (esperado: $expected, actual: $result)"
        ((PROBLEMS++))
    fi
}

echo "1️⃣ Verificando estructura de archivos..."
echo ""

check "Modelos" "find src/models -name '*.js' 2>/dev/null | wc -l | tr -d ' '" "22"
check "Controladores" "find src/controllers -name '*.js' 2>/dev/null | wc -l | tr -d ' '" "20"
check "Rutas" "find src/routes -name '*.js' 2>/dev/null | wc -l | tr -d ' '" "21"
check "Middleware" "find src/middleware -name '*.js' 2>/dev/null | wc -l | tr -d ' '" "1"

echo ""
echo "2️⃣ Verificando formato ES6..."
echo ""

# Contar exports incorrectos
exports_count=$(grep -r "^exports\." src/controllers/*.js 2>/dev/null | wc -l | tr -d ' ')
if [ "$exports_count" == "0" ]; then
    echo -e "📋 Formato exports... ${GREEN}✅ OK${NC} (0 CommonJS encontrados)"
else
    echo -e "📋 Formato exports... ${RED}❌ FAIL${NC} ($exports_count archivos con CommonJS)"
    ((PROBLEMS++))
fi

# Contar export const
export_const_count=$(grep -r "^export const" src/controllers/*.js 2>/dev/null | wc -l | tr -d ' ')
echo -e "📋 Funciones ES6... ${GREEN}✅ OK${NC} ($export_const_count funciones)"

echo ""
echo "3️⃣ Verificando imports..."
echo ""

# Verificar que todos los imports tengan .js
missing_js=$(grep -r "from ['\"]\..*[^\.js]['\"]" src/ 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
if [ "$missing_js" == "0" ]; then
    echo -e "📋 Extensions .js... ${GREEN}✅ OK${NC}"
else
    echo -e "📋 Extensions .js... ${YELLOW}⚠️  ADVERTENCIA${NC} ($missing_js imports sin .js)"
fi

echo ""
echo "4️⃣ Verificando dependencias..."
echo ""

# Verificar package.json
if [ -f "package.json" ]; then
    echo -e "📋 package.json... ${GREEN}✅ OK${NC}"
    
    # Verificar dependencias críticas
    deps=("express" "mongoose" "bcryptjs" "jsonwebtoken" "dotenv" "cors")
    for dep in "${deps[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            echo -e "  ${GREEN}✓${NC} $dep"
        else
            echo -e "  ${RED}✗${NC} $dep (falta)"
            ((PROBLEMS++))
        fi
    done
else
    echo -e "📋 package.json... ${RED}❌ NO ENCONTRADO${NC}"
    ((PROBLEMS++))
fi

echo ""
echo "5️⃣ Verificando configuración..."
echo ""

# Verificar archivos de configuración
if [ -f ".env.example" ]; then
    echo -e "📋 .env.example... ${GREEN}✅ OK${NC}"
else
    echo -e "📋 .env.example... ${YELLOW}⚠️  NO ENCONTRADO${NC}"
fi

if [ -f ".env" ]; then
    echo -e "📋 .env... ${GREEN}✅ OK${NC}"
else
    echo -e "📋 .env... ${YELLOW}⚠️  NO ENCONTRADO${NC}"
fi

if [ -f "src/config/database.js" ]; then
    echo -e "📋 database.js... ${GREEN}✅ OK${NC}"
else
    echo -e "📋 database.js... ${RED}❌ NO ENCONTRADO${NC}"
    ((PROBLEMS++))
fi

if [ -f "src/middleware/auth.js" ]; then
    echo -e "📋 auth.js... ${GREEN}✅ OK${NC}"
else
    echo -e "📋 auth.js... ${RED}❌ NO ENCONTRADO${NC}"
    ((PROBLEMS++))
fi

echo ""
echo "6️⃣ Verificando scripts de Node.js..."
echo ""

# Verificar scripts importantes
scripts=("check-config.js" "check-mongodb.js")
for script in "${scripts[@]}"; do
    if [ -f "src/scripts/$script" ]; then
        echo -e "  ${GREEN}✓${NC} $script"
    else
        echo -e "  ${YELLOW}⚠${NC} $script (opcional, no encontrado)"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $PROBLEMS -eq 0 ]; then
    echo -e "${GREEN}✅ VERIFICACIÓN COMPLETA: TODO CORRECTO${NC}"
    echo ""
    echo "El backend está en perfecto estado ✨"
    echo ""
    echo "Puedes iniciar el servidor con:"
    echo -e "${BLUE}  npm run dev${NC}"
    exit 0
else
    echo -e "${RED}❌ VERIFICACIÓN COMPLETA: $PROBLEMS PROBLEMA(S) ENCONTRADO(S)${NC}"
    echo ""
    echo "Revisa los errores arriba y corrige los problemas."
    echo ""
    echo "Ayuda rápida:"
    echo "  • Si faltan archivos, puede que no estés en el directorio correcto"
    echo "  • Verifica que estés en el directorio /server"
    echo "  • Ejecuta: npm run check-config para más detalles"
    exit 1
fi

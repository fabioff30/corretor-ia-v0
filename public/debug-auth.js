// Debug script para testar autenticação e subscription
// Execute no console do navegador: loadScript('http://localhost:3004/debug-auth.js')

function loadScript(src) {
  const script = document.createElement('script');
  script.src = src;
  document.head.appendChild(script);
}

// Função para analisar diferenças de login
async function analyzeLoginDifferences() {
  console.log('🔍 [LOGIN DEBUG] Analisando diferenças entre login Google vs Email...');

  // Verificar se há usuário logado
  if (typeof window.debugAuth === 'function') {
    await window.debugAuth();
  }

  // Verificar método de login atual
  const user = window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner?.current;

  console.log('📋 [LOGIN DEBUG] Buscar no localStorage por dados de sessão...');

  // Verificar se há dados de sessão no localStorage
  const supabaseKeys = Object.keys(localStorage).filter(key => key.includes('supabase'));
  if (supabaseKeys.length > 0) {
    console.log('📋 [LOGIN DEBUG] Dados Supabase encontrados:', supabaseKeys);

    supabaseKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data?.user) {
          console.log('👤 [LOGIN DEBUG] User data em', key, ':', {
            id: data.user.id,
            email: data.user.email,
            provider: data.user.app_metadata?.provider,
            providers: data.user.app_metadata?.providers
          });
        }
      } catch (e) {
        console.log('⚠️ [LOGIN DEBUG] Erro ao parse', key);
      }
    });
  }

  console.log('🏁 [LOGIN DEBUG] Análise finalizada');
}

// Função principal de debug
async function testAuthFix() {
  console.log('🔍 [DEBUG] Iniciando teste de autenticação...');

  // 1. Verificar se as funções de debug estão disponíveis
  if (typeof window.debugAuth === 'function') {
    console.log('✅ [DEBUG] window.debugAuth está disponível');
    await window.debugAuth();
  } else {
    console.log('❌ [DEBUG] window.debugAuth não está disponível');
  }

  // 2. Verificar localStorage para invalidação de cache
  const cacheInvalidation = localStorage.getItem('subscriptionCacheInvalidation');
  if (cacheInvalidation) {
    console.log('📋 [DEBUG] Cache invalidation data:', JSON.parse(cacheInvalidation));
  } else {
    console.log('📋 [DEBUG] Nenhum cache invalidation encontrado');
  }

  // 3. Verificar dados do contexto de auth
  console.log('📋 [DEBUG] Verificando contexto React...');

  // Tentar acessar o contexto via React DevTools
  if (window.React) {
    console.log('✅ [DEBUG] React está disponível');
  }

  // 4. Testar refresh manual
  if (typeof window.refreshAuth === 'function') {
    console.log('🔄 [DEBUG] Executando refresh manual...');
    await window.refreshAuth();
  }

  // 5. Verificar elementos na página que indicam status
  const userMenu = document.querySelector('[role="button"][aria-haspopup="menu"]');
  if (userMenu) {
    console.log('👤 [DEBUG] Menu do usuário encontrado:', userMenu);
  }

  const premiumBadge = document.querySelector('[role="button"] [data-state]');
  if (premiumBadge) {
    console.log('👑 [DEBUG] Badge premium encontrado:', premiumBadge.textContent);
  }

  // 6. Verificar caracteres limit na interface
  const charCounter = document.querySelector('div:has-text("caracteres")');
  if (charCounter) {
    console.log('🔢 [DEBUG] Contador de caracteres:', charCounter.textContent);
  }

  console.log('🏁 [DEBUG] Teste finalizado');
}

// Tornar funções disponíveis globalmente
window.testAuthFix = testAuthFix;
window.analyzeLoginDifferences = analyzeLoginDifferences;

console.log('📁 [DEBUG] Script carregado. Execute:');
console.log('- testAuthFix() para testar auth geral');
console.log('- analyzeLoginDifferences() para analisar diferenças de login');
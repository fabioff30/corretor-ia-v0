# Ajustes

1 - Caixa de texto da home deve responder a mudanças no banco de dados. Exemplo: - Se o usuário for premium, deve ter caracteres ilimitados, se for gratuito, deve se comportar de acordo com o limite colocado pelo admin.  

2 - Usuários admin também são premium

3 - Criar o admin dashboard

# Erros

1 - Verificar esses erros: Failed to load resource: the server responded with a status of 400 ()Understand this error
admin/dashboard?_rsc=skepm:1  Failed to load resource: the server responded with a status of 404 ()Understand this error
23940-173e426ea7966cd5.js:1 Uncaught (in promise) ZodError: [
  {
    "origin": "number",
    "code": "too_small",
    "minimum": 100,
    "inclusive": true,
    "path": [
      "max_characters"
    ],
    "message": "Mínimo 100 caracteres"
  }
]
    at 3940-173e426ea7966cd5.js:1:1488
    at push.33837.l [as resolver] (3940-173e426ea7966cd5.js:1:1644)
    at G (3940-173e426ea7966cd5.js:1:17978)
    at push.67300.Y.em (3940-173e426ea7966cd5.js:1:25141)
    at i8 (2f2a1a59-6120f736bce358fc.js:1:135369)
    at 2f2a1a59-6120f736bce358fc.js:1:141455
    at nz (2f2a1a59-6120f736bce358fc.js:1:19203)
    at sn (2f2a1a59-6120f736bce358fc.js:1:136602)
    at cc (2f2a1a59-6120f736bce358fc.js:1:163604)
    at ci (2f2a1a59-6120f736bce358fc.js:1:163426)Understand this error

    2 - Verificar eventual lentidão no banco de dados (entender se é o erro acima que está causando)
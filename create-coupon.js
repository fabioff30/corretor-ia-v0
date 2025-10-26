const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createCoupon() {
  try {
    const coupon = await stripe.coupons.create({
      percent_off: 50,
      duration: 'once',
      name: 'Oferta Especial - 50% OFF Primeiro Mês',
      metadata: {
        campaign: 'limit_reached',
        description: 'Cupom de 50% para usuários que atingiram o limite gratuito'
      }
    });
    
    console.log('Cupom criado com sucesso!');
    console.log('ID:', coupon.id);
    console.log('Código:', coupon.id);
    console.log('Desconto:', coupon.percent_off + '%');
    console.log('Duração:', coupon.duration);
  } catch (error) {
    console.error('Erro ao criar cupom:', error.message);
  }
}

createCoupon();

import React from 'react'

export default function CTASection(){
  return (
    <section style={{marginTop:20,textAlign:'center'}}>
      <h3>Pronto para aumentar suas vendas?</h3>
      <p className="lead">Teste o template gratuitamente e experimente o impacto dos gatilhos neurais no seu faturamento.</p>
      <p style={{marginTop:12}}>
        <a className="primary-cta" href="#">Começar agora</a>
        <a className="secondary-cta" href="#" style={{marginLeft:12}}>Ver demo</a>
      </p>
    </section>
  )
}
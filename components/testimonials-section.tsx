import React from 'react'

const testimonials = [
  {name:'Marília, Dona do Bistrô', quote:'A taxa de conversão subiu 28% em 2 semanas — o texto e o fluxo funcionaram.'},
  {name:'Café da Praça', quote:'Integração simples e clientes mais engajados — recomendo.'}
]

export default function Testimonials(){
  return (
    <section id="testimonials" className="testimonials">
      <h2>Depoimentos</h2>
      {testimonials.map(t=> (
        <div key={t.name} className="testimonial">
          <strong>{t.name}</strong>
          <p>{t.quote}</p>
        </div>
      ))}
    </section>
  )
}
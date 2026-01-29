import React from 'react'

export default function Features(){
  const items = [
    {title:'Gatilhos persuasivos', desc:'Headlines e microcopy baseados em princípios de psicologia para aumentar cliques.'},
    {title:'Prova social', desc:'Depoimentos e indicadores de uso para reduzir hesitação.'},
    {title:'CTA otimizados', desc:'Botões com texto orientado à ação e urgência controlada.'}
  ]

  return (
    <section id="features" className="features" aria-label="Recursos">
      {items.map(it=> (
        <div key={it.title} className="card">
          <h3>{it.title}</h3>
          <p>{it.desc}</p>
        </div>
      ))}
    </section>
  )
}
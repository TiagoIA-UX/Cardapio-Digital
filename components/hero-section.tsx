import React, { useState } from 'react'

export default function HeroSection(){
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'sending'|'ok'|'error'>('idle')

  async function submit(e: React.FormEvent){
    e.preventDefault()
    setStatus('sending')
    try{
      const res = await fetch('/api/subscribe', { method:'POST', body: JSON.stringify({email}), headers:{'Content-Type':'application/json'} })
      if(res.ok){ setStatus('ok'); setEmail('') }
      else setStatus('error')
    }catch(err){ setStatus('error') }
  }

  const bgUrl = 'https://source.unsplash.com/1600x1000/?food,restaurant'

  return (
    <section className="hero" style={{backgroundImage:`url(${bgUrl})`,backgroundSize:'cover',backgroundPosition:'center',borderRadius:12,padding:'3rem'}}>
      <div style={{background:'rgba(255,255,255,0.9)',padding:20,borderRadius:8}}>
        <h1>Converta visitantes em clientes com gatilhos neurais</h1>
        <p className="lead">Template otimizado com linguagem persuasiva, prova social e CTAs claros — projetado para aumentar conversões rapidamente.</p>

        <form className="form" onSubmit={submit}>
          <input aria-label="seu email" placeholder="Seu melhor e-mail" value={email} onChange={e=>setEmail(e.target.value)} />
          <button type="submit" className="primary-cta">Quero testar</button>
        </form>

        {status==='ok' && <p style={{textAlign:'center',marginTop:10,color:'green'}}>Obrigado — você receberá novidades por e-mail (demo)</p>}
        {status==='error' && <p style={{textAlign:'center',marginTop:10,color:'crimson'}}>Ocorreu um erro, tente novamente.</p>}

        <p style={{textAlign:'center',marginTop:12}} className="lead">Mais de <strong>+120 restaurantes</strong> melhoraram a conversão usando nosso fluxo de vendas.</p>
      </div>
    </section>
  )
}
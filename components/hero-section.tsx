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

  return (
    <section className="hero">
      <h1>Converta visitantes em clientes com gatilhos neurais</h1>
      <p className="lead">Template otimizado com linguagem persuasiva, prova social e CTAs claros — projetado para aumentar conversões rapidamente.</p>

      <form className="form" onSubmit={submit}>
        <input aria-label="seu email" placeholder="Seu melhor e-mail" value={email} onChange={e=>setEmail(e.target.value)} />
        <button type="submit" className="primary-cta">Quero testar</button>
      </form>

      {status==='ok' && <p style={{textAlign:'center',marginTop:10,color:'green'}}>Obrigado — você receberá novidades por e-mail (demo)</p>}
      {status==='error' && <p style={{textAlign:'center',marginTop:10,color:'crimson'}}>Ocorreu um erro, tente novamente.</p>}

      <p style={{textAlign:'center',marginTop:12}} className="lead">Mais de <strong>+120 restaurantes</strong> melhoraram a conversão usando nosso fluxo de vendas.</p>
    </section>
  )
}
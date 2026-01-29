"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Posso usar os templates em projetos comerciais?",
    answer: "Sim! Todos os templates incluem licença para uso comercial. Você pode usar em projetos próprios ou de clientes. Para agências que precisam de uso ilimitado, recomendamos a Licença Comercial.",
  },
  {
    question: "Recebo atualizações dos templates?",
    answer: "Sim, todas as compras incluem atualizações gratuitas. Para o Bundle Pro, as atualizações são vitalícias e você também recebe acesso a novos templates conforme forem lançados.",
  },
  {
    question: "Como funciona o suporte?",
    answer: "Oferecemos suporte por email para dúvidas técnicas sobre os templates. O tempo de resposta é de até 24 horas para compras individuais e prioritário para assinantes do Bundle Pro.",
  },
  {
    question: "Posso solicitar reembolso?",
    answer: "Sim, oferecemos garantia de 7 dias. Se você não estiver satisfeito com o template, pode solicitar reembolso integral sem perguntas.",
  },
  {
    question: "Os templates funcionam com TypeScript?",
    answer: "Sim! Todos os templates de Next.js e React são desenvolvidos com TypeScript e seguem as melhores práticas de tipagem.",
  },
  {
    question: "Preciso de conhecimento técnico para usar?",
    answer: "Depende do template. Templates de Notion e planilhas são fáceis de usar sem conhecimento técnico. Já templates de código requerem conhecimento básico de programação.",
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Perguntas Frequentes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Tire suas dúvidas sobre nossos templates.
          </p>
        </div>

        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border">
                <AccordionTrigger className="text-left text-foreground hover:text-accent">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

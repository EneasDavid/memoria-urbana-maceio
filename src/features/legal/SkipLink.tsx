// Link "pular para o conteúdo": primeiro item da navegação por teclado (item 11).
export function SkipLink() {
  return (
    <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[300] focus:rounded-full focus:bg-[#0b2f49] focus:px-4 focus:py-2 focus:text-white focus:text-[14px] focus:font-semibold">
      Pular para o conteúdo
    </a>
  )
}

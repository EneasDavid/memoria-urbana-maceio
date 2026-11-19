export function NotFound() {
  return (
    <main id="conteudo" className="min-h-dvh grid place-items-center bg-[#f6f3ec] text-black px-6">
      <div className="text-center max-w-[420px]">
        <img src="/memoria-urbana-logo.png" alt="" className="mx-auto w-14 h-14 rounded-full object-cover bg-white" />
        <h1 className="mt-4 text-[24px] font-bold">Monumento não encontrado</h1>
        <p className="mt-2 text-[15px] text-black/70">O endereço da placa pode estar incompleto. Confira o QR ou veja a lista de monumentos.</p>
        <a href="/" className="mt-5 inline-flex h-11 items-center rounded-full bg-[#1f6b6b] px-5 text-[15px] font-semibold text-white">Ver monumentos</a>
      </div>
    </main>
  )
}

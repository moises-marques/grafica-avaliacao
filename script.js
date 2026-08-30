/* =========================================================
   Gráfica JM Multi-Serviços — Lógica da Avaliação
   ========================================================= */

/* ======= CONFIGURAÇÕES QUE VOCÊ PRECISA EDITAR ======= */
const CONFIG = {
  // Número de WhatsApp da gráfica, com DDI e DDD, só números.
  whatsapp: "5592981100041",

  // Nome usado nas mensagens automáticas
  nomeEmpresa: "Gráfica JM Multi-Serviços"
};
/* ====================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const estrelas          = Array.from(document.querySelectorAll(".estrela"));
  const legendaEstrela    = document.getElementById("legenda-estrela");
  const inputNota         = document.getElementById("nota");
  const blocoMelhoria     = document.getElementById("bloco-melhoria");
  const blocoElogio       = document.getElementById("bloco-elogio");
  const chips             = Array.from(document.querySelectorAll(".chip"));
  const form              = document.getElementById("form-avaliacao");
  const erroForm          = document.getElementById("erro-form");
  const botaoEnviar       = document.getElementById("botao-enviar");

  const telaFormulario    = document.getElementById("tela-formulario");
  const telaSucesso       = document.getElementById("tela-sucesso");
  const telaMelhoria      = document.getElementById("tela-melhoria");
  const telaSaida         = document.getElementById("tela-saida");

  const linkWhatsappEl    = document.getElementById("link-whatsapp");

  const botaoNova1        = document.getElementById("botao-nova-avaliacao-1");
  const botaoNova2        = document.getElementById("botao-nova-avaliacao-2");
  const botaoSair1        = document.getElementById("botao-sair-1");
  const botaoSair2        = document.getElementById("botao-sair-2");

  let notaSelecionada = 0;
  let motivosSelecionados = [];

  const legendasPorNota = {
    1: "Muito ruim 😞",
    2: "Ruim 🙁",
    3: "Regular 😐",
    4: "Bom 🙂",
    5: "Excelente! 🤩"
  };

  /* ---------- Seleção de estrelas ---------- */
  function pintarEstrelas(nota){
    estrelas.forEach((btn) => {
      const valor = Number(btn.dataset.valor);
      const ativa = valor <= nota;
      btn.classList.toggle("ativa", ativa);
      btn.setAttribute("aria-checked", valor === nota ? "true" : "false");
    });
  }

  function selecionarNota(nota){
    notaSelecionada = nota;
    inputNota.value = String(nota);
    pintarEstrelas(nota);
    legendaEstrela.textContent = legendasPorNota[nota] || "";

    // Regra principal do sistema: nota 5 = elogio opcional | nota <= 4 = motivo obrigatório
    if (nota === 5){
      blocoElogio.hidden = false;
      blocoMelhoria.hidden = true;
    } else if (nota > 0){
      blocoMelhoria.hidden = false;
      blocoElogio.hidden = true;
    }
    esconderErro();
  }

  estrelas.forEach((btn) => {
    btn.addEventListener("click", () => selecionarNota(Number(btn.dataset.valor)));

    // Efeito de pré-visualização ao passar o mouse (desktop)
    btn.addEventListener("mouseenter", () => pintarEstrelas(Number(btn.dataset.valor)));
    btn.addEventListener("mouseleave", () => pintarEstrelas(notaSelecionada));
  });

  /* ---------- Chips de motivo (nota baixa) ---------- */
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selecionado");
      const motivo = chip.dataset.motivo;
      if (chip.classList.contains("selecionado")){
        motivosSelecionados.push(motivo);
      } else {
        motivosSelecionados = motivosSelecionados.filter((m) => m !== motivo);
      }
    });
  });

  /* ---------- Validação e envio ---------- */
  function mostrarErro(mensagem){
    erroForm.textContent = mensagem;
    erroForm.hidden = false;
    erroForm.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function esconderErro(){
    erroForm.hidden = true;
    erroForm.textContent = "";
  }

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    esconderErro();

    if (notaSelecionada === 0){
      mostrarErro("Por favor, selecione de 1 a 5 estrelas antes de enviar.");
      return;
    }

    const comentarioNegativo = document.getElementById("comentario-negativo").value.trim();

    // Regra de negócio: nota 4 para baixo exige explicação (motivo ou comentário)
    if (notaSelecionada <= 4 && motivosSelecionados.length === 0 && comentarioNegativo === ""){
      mostrarErro("Conte pra gente o que podemos melhorar: escolha ao menos um motivo ou escreva um comentário.");
      return;
    }

    const avaliacao = {
      id: Date.now(),
      data: new Date().toISOString(),
      servico: document.getElementById("servico").value || "Não informado",
      nota: notaSelecionada,
      nome: document.getElementById("nome").value.trim() || "Anônimo",
      motivos: motivosSelecionados,
      comentarioNegativo: comentarioNegativo,
      comentarioPositivo: document.getElementById("comentario-positivo").value.trim(),
      telefoneContato: document.getElementById("telefone-contato").value.trim()
    };

    salvarAvaliacao(avaliacao);
    exibirResultado(avaliacao);
  });

  /* ---------- Armazenamento local (sem backend) ---------- */
  function salvarAvaliacao(avaliacao){
    try {
      const chave = "avaliacoesGraficaJM";
      const lista = JSON.parse(localStorage.getItem(chave) || "[]");
      lista.push(avaliacao);
      localStorage.setItem(chave, JSON.stringify(lista));
    } catch (erro) {
      // Se o navegador do cliente bloquear localStorage (modo privado, etc.),
      // a avaliação ainda segue normalmente para a tela de resultado.
      console.warn("Não foi possível salvar localmente:", erro);
    }
  }

  /* ---------- Telas de resultado ---------- */
  function exibirResultado(avaliacao){
    telaFormulario.hidden = true;

    // A partir de agora, TODA avaliação (5 estrelas ou não) é enviada
    // automaticamente para o WhatsApp da gráfica assim que o cliente
    // clica em "Enviar avaliação".
    const mensagem = montarMensagemWhatsapp(avaliacao);
    const linkWhatsapp = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(linkWhatsapp, "_blank");

    if (avaliacao.nota === 5){
      telaSucesso.hidden = false;
      telaSucesso.scrollIntoView({ behavior: "smooth" });
    } else {
      linkWhatsappEl.href = linkWhatsapp;
      telaMelhoria.hidden = false;
      telaMelhoria.scrollIntoView({ behavior: "smooth" });
    }
  }

  function montarMensagemWhatsapp(avaliacao){
    const linhas = [
      `Olá, ${CONFIG.nomeEmpresa}!`,
      `Acabei de avaliar o serviço "${avaliacao.servico}" com nota ${avaliacao.nota}/5.`,
    ];
    if (avaliacao.nota === 5 && avaliacao.comentarioPositivo){
      linhas.push(`Elogio: ${avaliacao.comentarioPositivo}`);
    }
    if (avaliacao.motivos.length){
      linhas.push(`Motivos: ${avaliacao.motivos.join(", ")}.`);
    }
    if (avaliacao.comentarioNegativo){
      linhas.push(`Comentário: ${avaliacao.comentarioNegativo}`);
    }
    linhas.push(`Nome: ${avaliacao.nome}`);
    return linhas.join("\n");
  }

  /* ---------- Reiniciar para nova avaliação ---------- */
  function reiniciarFormulario(){
    form.reset();
    notaSelecionada = 0;
    motivosSelecionados = [];
    pintarEstrelas(0);
    legendaEstrela.textContent = "Toque em uma estrela para avaliar";
    blocoMelhoria.hidden = true;
    blocoElogio.hidden = true;
    chips.forEach((chip) => chip.classList.remove("selecionado"));
    esconderErro();

    telaSucesso.hidden = true;
    telaMelhoria.hidden = true;
    telaFormulario.hidden = false;
    telaFormulario.scrollIntoView({ behavior: "smooth" });
  }

  botaoNova1.addEventListener("click", reiniciarFormulario);
  botaoNova2.addEventListener("click", reiniciarFormulario);

  /* ---------- Sair do sistema ---------- */
  function sairDoSistema(){
    telaFormulario.hidden = true;
    telaSucesso.hidden = true;
    telaMelhoria.hidden = true;
    telaSaida.hidden = false;
    telaSaida.scrollIntoView({ behavior: "smooth" });

    // Tenta fechar a aba automaticamente. Isso só funciona quando a aba
    // foi aberta por script; a maioria dos navegadores bloqueia o fechamento
    // de abas abertas normalmente (ex: escaneando o QR code) por segurança.
    // Por isso a tela acima já avisa o cliente para fechar manualmente.
    window.close();
  }

  botaoSair1.addEventListener("click", sairDoSistema);
  botaoSair2.addEventListener("click", sairDoSistema);
});
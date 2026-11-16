(() => {
    const paginas = [
        { arquivo: "index.html", titulo: "Início" },
        { arquivo: "sumario.html", titulo: "Sumário" },
        { arquivo: "sobremim.html", titulo: "Identificação pessoal" },
        { arquivo: "objetivos.html", titulo: "Objetivos" },
        { arquivo: "plano.html", titulo: "Plano pessoal de estudos" },
        { arquivo: "historia.html", titulo: "História de vida" },
        { arquivo: "projeto.html", titulo: "Projeto de vida" },
        { arquivo: "linguagens.html", titulo: "Linguagens" },
        { arquivo: "humanas.html", titulo: "Humanas" },
        { arquivo: "natureza.html", titulo: "Natureza" },
        { arquivo: "matematica.html", titulo: "Matemática" },
        { arquivo: "senai.html", titulo: "SENAI" },
        { arquivo: "curriculo.html", titulo: "Currículo" },
        { arquivo: "consideracoes.html", titulo: "Considerações finais" },
        { arquivo: "referencias.html", titulo: "Referências" },
        { arquivo: "anexos.html", titulo: "Anexos" }
    ];

    if (document.querySelector(".navegacao-paginas")) {
        return;
    }

    const paginaAtual = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const indiceAtual = paginas.findIndex((pagina) => pagina.arquivo.toLowerCase() === paginaAtual);

    if (indiceAtual === -1) {
        return;
    }

    const anterior = paginas[(indiceAtual - 1 + paginas.length) % paginas.length];
    const proxima = paginas[(indiceAtual + 1) % paginas.length];

    const estilo = document.createElement("style");
    estilo.id = "navegacao-estilos";
    estilo.textContent = `
        .navegacao-paginas {
            position: fixed;
            inset: auto 0 0;
            z-index: 9998;
            pointer-events: none;
        }

        .navegacao-paginas .seta-pagina {
            position: fixed;
            bottom: clamp(14px, 2vw, 22px);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border: 1px solid var(--borda, #efc1d2);
            border-radius: 50%;
            background: rgba(255, 250, 252, 0.7);
            color: var(--vinho-suave, #9d4268);
            font-family: 'DM Sans', sans-serif;
            font-size: 18px;
            font-weight: 600;
            line-height: 1;
            text-decoration: none;
            box-shadow: 0 5px 16px rgba(121, 4, 59, 0.1);
            opacity: 0.8;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            cursor: pointer;
            pointer-events: auto;
            transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }

        .navegacao-paginas .seta-anterior {
            left: clamp(12px, 2vw, 22px);
        }

        .navegacao-paginas .seta-proxima {
            right: clamp(12px, 2vw, 22px);
        }

        .navegacao-paginas .seta-pagina:hover {
            background: var(--vinho, #79043b);
            color: #fff;
            opacity: 1;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(121, 4, 59, 0.2);
        }

        .navegacao-paginas .seta-pagina:focus-visible {
            outline: 2px solid var(--vinho, #79043b);
            outline-offset: 3px;
            opacity: 1;
        }

        @media (max-width: 600px) {
            .navegacao-paginas .seta-pagina {
                width: 34px;
                height: 34px;
                font-size: 16px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .navegacao-paginas .seta-pagina {
                transition-duration: 0.01ms !important;
            }
        }
    `;

    document.head.appendChild(estilo);

    const navegacao = document.createElement("nav");
    navegacao.className = "navegacao-paginas";
    navegacao.setAttribute("aria-label", "Navegação entre páginas");
    navegacao.innerHTML = `
        <a class="seta-pagina seta-anterior" href="${anterior.arquivo}" aria-label="Página anterior: ${anterior.titulo}" title="Anterior: ${anterior.titulo}">&#8592;</a>
        <a class="seta-pagina seta-proxima" href="${proxima.arquivo}" aria-label="Próxima página: ${proxima.titulo}" title="Próxima: ${proxima.titulo}">&#8594;</a>
    `;

    document.body.appendChild(navegacao);
})();

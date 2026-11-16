(() => {
    const SUPABASE_URL = "https://tkgwntyzlzuvjrcdhcre.supabase.co";
    const SUPABASE_KEY = "sb_publishable_9d3JAJtGyDgB4R6ncvWj3g_fzXeYj4h";
    const BUCKET = "atividades";
    const PAGINA = (location.pathname.split("/").pop() || "index.html")
        .replace(/\.html?$/i, "")
        .toLowerCase();

    const cliente = window.supabase
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
        : null;

    const secoes = document.querySelectorAll(".eixo");

    function nomeSeguro(nome) {
        return nome
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9._-]/g, "-")
            .toLowerCase();
    }

    function urlPublica(caminho) {
        const { data } = cliente.storage.from(BUCKET).getPublicUrl(caminho);
        return data.publicUrl;
    }

    function hojeISO() {
        const agora = new Date();
        const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    }

    function formatarData(iso) {
        if (!iso) {
            return "";
        }

        const partes = iso.split("-");

        if (partes.length !== 3) {
            return iso;
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function converterData(texto) {
        const valor = texto.trim();
        const br = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        const iso = valor.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

        let ano;
        let mes;
        let dia;

        if (br) {
            dia = Number(br[1]);
            mes = Number(br[2]);
            ano = Number(br[3]);
        } else if (iso) {
            ano = Number(iso[1]);
            mes = Number(iso[2]);
            dia = Number(iso[3]);
        } else {
            return null;
        }

        const data = new Date(ano, mes - 1, dia);

        if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
            return null;
        }

        return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    }

    function dataDoObjeto(item) {
        const encontrada = item.name.match(/^(\d{4}-\d{2}-\d{2})--/);

        if (encontrada) {
            return encontrada[1];
        }

        if (item.created_at) {
            return item.created_at.slice(0, 10);
        }

        return hojeISO();
    }

    function mostrarStatus(area, texto, erro) {
        const status = area.querySelector(".status-upload");
        status.textContent = texto;
        status.classList.toggle("erro", Boolean(erro));
    }

    function criarCard(cards, url, caminho, nome, dataISO) {
        let caminhoAtual = caminho;
        let dataAtual = dataISO;

        const card = document.createElement("div");
        card.className = "card card-upload";

        const imagem = document.createElement("img");
        imagem.src = url;
        imagem.alt = nome;
        imagem.loading = "lazy";

        imagem.addEventListener("click", () => {
            if (typeof window.abrirAtividade === "function") {
                window.abrirAtividade(imagem.src, "Imagem carregada", nome);
            }
        });

        const data = document.createElement("span");
        data.className = "data";
        data.textContent = formatarData(dataAtual);

        const editar = document.createElement("button");
        editar.type = "button";
        editar.className = "editar-data";
        editar.setAttribute("aria-label", "Editar data");
        editar.title = "Editar data";
        editar.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i>';

        editar.addEventListener("click", async () => {
            const entrada = prompt("Data da imagem (DD/MM/AAAA):", formatarData(dataAtual));

            if (entrada === null) {
                return;
            }

            const novaData = converterData(entrada);

            if (!novaData) {
                alert("Data inválida. Use o formato DD/MM/AAAA.");
                return;
            }

            const partes = caminhoAtual.split("/");
            const nomeAtual = partes.pop();
            const pasta = partes.join("/");
            const semData = nomeAtual.replace(/^\d{4}-\d{2}-\d{2}--/, "");
            const novoCaminho = `${pasta}/${novaData}--${semData}`;

            if (novoCaminho === caminhoAtual) {
                return;
            }

            editar.disabled = true;

            const { error: erroCopia } = await cliente.storage
                .from(BUCKET)
                .copy(caminhoAtual, novoCaminho);

            if (erroCopia) {
                editar.disabled = false;
                console.error("Erro ao copiar imagem:", erroCopia);
                alert("Não foi possível alterar a data: " + erroCopia.message);
                return;
            }

            const { error: erroRemocao } = await cliente.storage
                .from(BUCKET)
                .remove([caminhoAtual]);

            if (erroRemocao) {
                await cliente.storage.from(BUCKET).remove([novoCaminho]);
                editar.disabled = false;
                console.error("Erro ao remover imagem antiga:", erroRemocao);
                alert("Não foi possível concluir a alteração da data.");
                return;
            }

            caminhoAtual = novoCaminho;
            dataAtual = novaData;
            imagem.src = urlPublica(novoCaminho);
            data.textContent = formatarData(novaData);
            editar.disabled = false;
        });

        const remover = document.createElement("button");
        remover.type = "button";
        remover.className = "remover-upload";
        remover.setAttribute("aria-label", "Remover imagem");
        remover.title = "Remover imagem";
        remover.innerHTML = "&times;";

        remover.addEventListener("click", async () => {
            if (!confirm("Remover esta imagem permanentemente?")) {
                return;
            }

            remover.disabled = true;

            const { error } = await cliente.storage.from(BUCKET).remove([caminhoAtual]);

            if (error) {
                remover.disabled = false;
                alert("Não foi possível remover a imagem: " + error.message);
                return;
            }

            card.remove();
        });

        card.append(imagem, data, editar, remover);
        cards.appendChild(card);
    }

    async function carregarExistentes(cards, eixo) {
        if (!cliente) {
            return;
        }

        const pasta = `${PAGINA}/eixo-${eixo}`;

        const { data, error } = await cliente.storage.from(BUCKET).list(pasta, {
            limit: 100,
            sortBy: { column: "created_at", order: "asc" }
        });

        if (error) {
            console.warn("Não foi possível listar as imagens salvas:", error);
            return;
        }

        if (!data) {
            return;
        }

        data
            .filter((item) => /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i.test(item.name))
            .sort((a, b) => {
                const dataA = dataDoObjeto(a);
                const dataB = dataDoObjeto(b);
                return dataA.localeCompare(dataB) || (a.created_at || "").localeCompare(b.created_at || "");
            })
            .forEach((item) => {
                const caminho = `${pasta}/${item.name}`;
                criarCard(cards, urlPublica(caminho), caminho, item.name, dataDoObjeto(item));
            });
    }

    secoes.forEach((secao, indice) => {
        const atividades = secao.querySelector(".atividades");
        const cards = secao.querySelector(".cards");

        if (!atividades || !cards) {
            return;
        }

        const eixo = indice + 1;
        const id = `upload-${PAGINA}-${eixo}`;

        const area = document.createElement("div");
        area.className = "upload-eixo";
        area.innerHTML = `
            <label class="btn-upload" for="${id}">
                <i class="fa-solid fa-image" aria-hidden="true"></i>
                <span>Carregar imagem</span>
            </label>
            <input class="input-upload" type="file" id="${id}" accept="image/*" multiple>
            <span class="status-upload" role="status"></span>
        `;

        atividades.appendChild(area);

        const input = area.querySelector(".input-upload");

        input.addEventListener("change", async () => {
            const arquivos = Array.from(input.files);
            input.value = "";

            if (!arquivos.length) {
                return;
            }

            if (!cliente) {
                mostrarStatus(area, "Não foi possível conectar ao Supabase.", true);
                return;
            }

            area.classList.add("enviando");

            for (const arquivo of arquivos) {
                if (!arquivo.type.startsWith("image/")) {
                    continue;
                }

                const hoje = hojeISO();
                const nome = `${hoje}--${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${nomeSeguro(arquivo.name)}`;
                const caminho = `${PAGINA}/eixo-${eixo}/${nome}`;

                mostrarStatus(area, "Enviando imagem...", false);

                const { error } = await cliente.storage.from(BUCKET).upload(caminho, arquivo, {
                    cacheControl: "31536000",
                    contentType: arquivo.type,
                    upsert: false
                });

                if (error) {
                    console.error("Erro ao enviar para o Supabase:", error);

                    const mensagem = /bucket|row-level security|policy/i.test(error.message)
                        ? "Armazenamento na nuvem ainda não configurado. Rode o SQL de configuração no Supabase."
                        : "Erro ao salvar: " + error.message;

                    mostrarStatus(area, mensagem, true);
                    continue;
                }

                criarCard(cards, urlPublica(caminho), caminho, arquivo.name, hoje);
                mostrarStatus(area, "", false);
            }

            area.classList.remove("enviando");
        });

        carregarExistentes(cards, eixo);
    });
})();

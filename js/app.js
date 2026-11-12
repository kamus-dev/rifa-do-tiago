
const grid = document.getElementById("grid");
const painel = document.getElementById("painel");

const TOTAL_NUMEROS = 900;

let dados = {};
let numeroSelecionado = null;

function formatarNumero(num) {
  return String(num).padStart(3, "0");
}

// Carregar reservas do Firebase
db.collection("rifa")
  .orderBy("timestamp")
  .onSnapshot(
    (snapshot) => {
      dados = {};

      snapshot.forEach((doc) => {
        dados[doc.id] = doc.data();
      });

      render();
      atualizarProgresso();
    },
    (error) => {
      console.error("Erro ao carregar a rifa:", error);
      alert("Não foi possível carregar os números da rifa.");
    }
  );

// Copiar PIX
function copiarPix() {
  navigator.clipboard.writeText("034.635.061-14")
    .then(() => alert("PIX copiado!"))
    .catch(() => alert("Não foi possível copiar o PIX."));
}

// Abrir formulário de reserva
function reservarNumero(numero) {
  numeroSelecionado = numero;
  document.getElementById("formReserva").style.display = "block";
}

// Fechar formulário
function fecharForm() {
  document.getElementById("formReserva").style.display = "none";
  document.getElementById("nome").value = "";
  document.getElementById("telefone").value = "";
  numeroSelecionado = null;
}

// Confirmar reserva
async function confirmarReserva() {
  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();

  if (!nome || !telefone) {
    alert("Preencha todos os campos.");
    return;
  }

  if (!numeroSelecionado) {
    alert("Nenhum número foi selecionado.");
    return;
  }

  try {
    await db.runTransaction(async (transaction) => {
      const ref = db.collection("rifa").doc(String(numeroSelecionado));
      const doc = await transaction.get(ref);

      if (doc.exists) {
        throw new Error("Número já reservado.");
      }

      transaction.set(ref, {
        nome: nome,
        telefone: telefone,
        pago: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    alert("Número reservado com sucesso!");
    fecharForm();

  } catch (error) {
    console.error("Erro ao reservar número:", error);
    alert(error.message || "Não foi possível reservar o número.");
  }
}

// Marcar pagamento
async function marcarPago(num) {
  if (!adminLogado) {
    alert("Faça login como administrador.");
    return;
  }

  try {
    await db.collection("rifa")
      .doc(String(num))
      .update({ pago: true });

    alert(`Número ${formatarNumero(num)} marcado como pago!`);

  } catch (error) {
    console.error("Erro ao marcar pagamento:", error);
    alert("Não foi possível marcar o número como pago.");
  }
}

// Liberar número
async function desreservarNumero(num) {
  if (!adminLogado) {
    alert("Faça login como administrador.");
    return;
  }

  const confirmar = confirm(
    `Tem certeza que deseja liberar o número ${formatarNumero(num)}?\n\nA reserva será apagada e o número ficará disponível novamente.`
  );

  if (!confirmar) return;

  try {
    await db.collection("rifa")
      .doc(String(num))
      .delete();

    alert(`Número ${formatarNumero(num)} liberado com sucesso!`);

  } catch (error) {
    console.error("Erro ao liberar o número:", error);
    alert("Não foi possível liberar o número.");
  }
}

// Proteger exibição de nomes
function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto || "";
  return div.innerHTML;
}

// Atualizar painel administrativo
function atualizarPainel() {
  painel.innerHTML = "";

  Object.keys(dados)
    .sort((a, b) => Number(a) - Number(b))
    .forEach(function (num) {
      const item = dados[num];
      const div = document.createElement("div");

      div.className = "item";

      let html = `
        <div style="font-weight:bold; font-size:16px;">
          Nº ${formatarNumero(num)}
        </div>

        <div style="margin-top:5px;">
          ${escaparHTML(item.nome)}
        </div>
      `;

      if (item.pago) {
        html += `
          <div class="status">
            Pago
          </div>
        `;
      } else {
        html += `
          <div class="status">
            Aguardando pagamento
          </div>
        `;

        if (adminLogado) {
          html += `
            <button onclick="marcarPago(${Number(num)})">
              Já pagou
            </button>

            <button
              onclick="desreservarNumero(${Number(num)})"
              style="background:#dc2626; margin-top:8px;"
            >
              Não pagou
            </button>
          `;
        }
      }

      div.innerHTML = html;
      painel.appendChild(div);
    });
}

// Atualizar progresso
function atualizarProgresso() {
  const vendidos = Object.keys(dados).length;
  const porcentagem = (vendidos / TOTAL_NUMEROS) * 100;

  const barra = document.getElementById("barra");
  const texto = document.getElementById("textoProgresso");

  if (barra) {
    barra.style.width = porcentagem + "%";
  }

  if (texto) {
    texto.innerText =
      `${vendidos} de ${TOTAL_NUMEROS} números reservados`;
  }
}

// Gerar grade de números
function render() {
  grid.innerHTML = "";

  for (let i = 1; i <= TOTAL_NUMEROS; i++) {
    const div = document.createElement("div");
    div.className = "num";

    const item = dados[String(i)];

    if (item) {
      div.classList.add("reservado");

      if (item.pago) {
        div.classList.add("pago");
      }

      div.innerHTML = `
        <div class="numero">
          ${formatarNumero(i)}
        </div>

        <div class="nome">
          ${escaparHTML(item.nome)}
        </div>
      `;

      div.onclick = () => {
        alert("Número já reservado.");
      };

    } else {
      div.innerHTML = `
        <div class="numero">
          ${formatarNumero(i)}
        </div>
      `;

      div.onclick = () => reservarNumero(i);
    }

    grid.appendChild(div);
  }

  atualizarPainel();
}

render();

const grid = document.getElementById("grid");
const painel = document.getElementById("painel");

let dados = {};
let numeroSelecionado = null;

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


function copiarPix() {

  navigator.clipboard.writeText("034.635.061-14");

  alert("PIX copiado!");

}


function reservarNumero(numero) {

  numeroSelecionado = numero;

  document.getElementById("formReserva").style.display = "block";

}


function fecharForm() {

  document.getElementById("formReserva").style.display = "none";

  document.getElementById("nome").value = "";
  document.getElementById("telefone").value = "";

  numeroSelecionado = null;

}


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

      const ref = db
        .collection("rifa")
        .doc(String(numeroSelecionado));

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


async function marcarPago(num) {

  if (!adminLogado) {

    alert("Faça login como administrador.");

    return;

  }

  try {

    await db
      .collection("rifa")
      .doc(String(num))
      .update({
        pago: true
      });

    alert(`Número ${String(num).padStart(2, "0")} marcado como pago!`);

  } catch (error) {

    console.error("Erro ao marcar pagamento:", error);

    alert("Não foi possível marcar o número como pago.");

  }

}


async function desreservarNumero(num) {

  if (!adminLogado) {

    alert("Faça login como administrador.");

    return;

  }

  const confirmar = confirm(
    `Tem certeza que deseja liberar o número ${String(num).padStart(2, "0")}?\n\nA reserva será apagada e o número ficará disponível novamente.`
  );

  if (!confirmar) {

    return;

  }

  try {

    await db
      .collection("rifa")
      .doc(String(num))
      .delete();

    alert(
      `Número ${String(num).padStart(2, "0")} liberado com sucesso!`
    );

  } catch (error) {

    console.error("Erro ao liberar número:", error);

    alert("Não foi possível liberar o número.");

  }

}


function escaparHTML(texto) {

  const div = document.createElement("div");

  div.textContent = texto || "";

  return div.innerHTML;

}


function atualizarPainel() {

  painel.innerHTML = "";

  Object.keys(dados)
    .sort((a, b) => a - b)
    .forEach(function (num) {

      const item = dados[num];

      const div = document.createElement("div");

      div.className = "item";

      let html = `
        <div style="font-weight:bold; font-size:16px;">
          Nº ${String(num).padStart(2, "0")}
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
            <button onclick="marcarPago(${num})">
              Já pagou
            </button>

            <button
              onclick="desreservarNumero(${num})"
              style="
                background:#dc2626;
                margin-top:8px;
              "
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


function atualizarProgresso() {

  const total = 300;

  const vendidos = Object.keys(dados).length;

  const porcentagem = (vendidos / total) * 100;

  const barra = document.getElementById("barra");

  const texto = document.getElementById("textoProgresso");

  if (barra) {

    barra.style.width = porcentagem + "%";

  }

  if (texto) {

    texto.innerText =
      `${vendidos} de ${total} números reservados`;

  }

}


function render() {

  grid.innerHTML = "";

  for (let i = 1; i <= 300; i++) {

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
          ${String(i).padStart(2, "0")}
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
          ${String(i).padStart(2, "0")}
        </div>
      `;

      div.onclick = () => {

        reservarNumero(i);

      };

    }

    grid.appendChild(div);

  }

  atualizarPainel();

}


render();

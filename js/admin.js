let adminLogado = false;

function loginAdmin() {

  const email = prompt("E-mail do administrador:");
  const senha = prompt("Senha do administrador:");

  if (!email || !senha) {
    alert("Informe o e-mail e a senha.");
    return;
  }

  auth.signInWithEmailAndPassword(email, senha)

    .then((userCredential) => {

      adminLogado = true;

      alert("Login realizado com sucesso!");

      console.log(userCredential.user);

      render();

    })

    .catch((error) => {

      console.log(error);

      alert("Erro ao fazer login: " + error.message);

    });

}

document.addEventListener("DOMContentLoaded", function () {
    const body = document.body;
    const toggleDarkMode = document.getElementById("toggleDarkMode");

    document.getElementById('toggleEyeVisibility').addEventListener('click', function() {
        const elements = document.querySelectorAll('.eye_handler');
        const eyeIcon = document.querySelector('#toggleEyeVisibility i');
        
        elements.forEach(function(element) {
          if (element.style.filter === 'blur(5px)') {
            element.style.filter = 'none'; // Remove o blur
          } else {
            element.style.filter = 'blur(5px)'; // Aplica o blur
          }
        });
    
        // Alterna o ícone do olho
        if (eyeIcon.classList.contains('bi-eye')) {
          eyeIcon.classList.remove('bi-eye');
          eyeIcon.classList.add('bi-eye-slash'); // Ícone de olho fechado
        } else {
          eyeIcon.classList.remove('bi-eye-slash');
          eyeIcon.classList.add('bi-eye'); // Ícone de olho aberto
        }
      });

    // Verifica o modo salvo no localStorage e aplica
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "enabled") {
        body.classList.add("dark-mode");
        toggleDarkMode.innerHTML = '<i class="bi bi-sun"></i>';
    } else {
        body.classList.remove("dark-mode");
        toggleDarkMode.innerHTML = '<i class="bi bi-moon"></i>';
    }

    // Função para alternar entre modo escuro e claro
    toggleDarkMode.addEventListener("click", () => {
        const isDarkMode = body.classList.toggle("dark-mode");
        toggleDarkMode.innerHTML = isDarkMode ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';

        // Salva a preferência no localStorage
        if (isDarkMode) {
            localStorage.setItem("darkMode", "enabled");
        } else {
            localStorage.removeItem("darkMode");
        }
    });
});

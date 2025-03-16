window.onload = function() {
    const canvas = document.getElementById("matrixCanvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      // Ajusta as dimensões do canvas para ocupar 100% do elemento pai
      canvas.width = canvas.parentNode.offsetWidth;
      canvas.height = canvas.parentNode.offsetHeight;
  
      const fontSize = 14; // Tamanho da fonte
      const columns = Math.floor(canvas.width / fontSize);
      const drops = [];
      // Inicializa cada "coluna" com um valor aleatório
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * canvas.height / fontSize);
      }
  
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      
      function draw() {
        // Fundo com leve transparência para criar o efeito de "rastro"
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#FF0000"; // Código em vermelho
        ctx.font = fontSize + "px monospace";
  
        // Desenha um caractere para cada coluna
        for (let i = 0; i < drops.length; i++) {
          const text = letters.charAt(Math.floor(Math.random() * letters.length));
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          // Reinicia a queda se o caractere sair da tela, com uma pequena chance
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      }
      
      setInterval(draw, 33);
    }
  };
  
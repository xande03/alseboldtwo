import { useEffect, useState } from 'react';

const Splashscreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Define um tempo mínimo para o splashscreen (2 segundos)
    const minSplashTime = 2000;
    const startTime = Date.now();

    // Verifica se o conteúdo principal já foi carregado
    const checkContentLoaded = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minSplashTime - elapsedTime);
      
      // Espera o tempo mínimo ou esconde imediatamente se já passou
      setTimeout(() => {
        setIsVisible(false);
        
        // Remove o elemento do DOM após a transição
        setTimeout(() => {
          const splashElement = document.getElementById('splashscreen');
          if (splashElement) {
            splashElement.remove();
          }
        }, 500); // Tempo igual à duração da transição CSS
      }, remainingTime);
    };

    // Verifica se o DOM está pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkContentLoaded);
    } else {
      checkContentLoaded();
    }

    // Limpa o event listener caso o componente seja desmontado
    return () => {
      document.removeEventListener('DOMContentLoaded', checkContentLoaded);
    };
  }, []);

  // Se o splashscreen não for mais visível, não renderiza nada
  if (!isVisible) {
    return null;
  }

  return null;
};

export default Splashscreen;
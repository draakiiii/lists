'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS, TooltipRenderProps } from 'react-joyride';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Crear un contexto para manejar el tour
interface OnboardingTourContextType {
  startTour: () => void;
  hasSeenTour: boolean;
  markTourAsSeen: () => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextType | undefined>(undefined);

// Hook personalizado para usar el contexto del tour
export const useOnboardingTour = () => {
  const context = useContext(OnboardingTourContext);
  if (context === undefined) {
    throw new Error('useOnboardingTour must be used within an OnboardingTourProvider');
  }
  return context;
};

// Proveedor del contexto para el tour
interface OnboardingTourProviderProps {
  children: ReactNode;
}

export const OnboardingTourProvider = ({ children }: OnboardingTourProviderProps) => {
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [ready, setReady] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Comprobar si el usuario ya ha visto el tour
  useEffect(() => {
    // Asegurar que estamos en el cliente antes de acceder a localStorage
    if (typeof window !== 'undefined' && !initialized) {
      try {
        // Usar una técnica más robusta para leer de localStorage
        const tourSeen = window.localStorage.getItem('hasSeenTour') === 'true';
        setHasSeenTour(tourSeen);
        setReady(true);
        setInitialized(true);
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        // En caso de error, reiniciar el estado
        setHasSeenTour(false);
        setReady(true);
        setInitialized(true);
      }
    }
  }, [initialized]);

  // Función para iniciar el tour manualmente
  const startTour = () => {
    // Emitir un evento que el componente OnboardingTour escuchará
    if (typeof window !== 'undefined') {
      // Asegurar que el localStorage está limpio para reiniciar el tour
      try {
        window.localStorage.removeItem('hasSeenTour');
        setHasSeenTour(false);
        
        const event = new CustomEvent('start-onboarding-tour');
        document.dispatchEvent(event);
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }
  };

  // Función para marcar el tour como visto manualmente
  const markTourAsSeen = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('hasSeenTour', 'true');
        setHasSeenTour(true);
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }
  };

  const contextValue = {
    startTour,
    hasSeenTour,
    markTourAsSeen
  };

  return (
    <OnboardingTourContext.Provider value={contextValue}>
      {children}
    </OnboardingTourContext.Provider>
  );
};

// Componente personalizado para el tooltip
const CustomTooltip = (props: TooltipRenderProps) => {
  const { backProps, closeProps, continuous, index, isLastStep, primaryProps, skipProps, step, tooltipProps, size } = props;
  const t = useTranslations('app.onboarding');
  
  const primaryText = continuous && !isLastStep 
    ? t('nextWithProgress', { step: index + 1, steps: size })
    : t('finish');

  return (
    <div {...tooltipProps} className="custom-tooltip">
      <div className="tooltip-content">
        {step.content}
      </div>
      <div className="tooltip-footer">
        <div className="tooltip-buttons">
          {skipProps && (
            <button {...skipProps} className="tooltip-button skip-button">
              {t('skip')}
            </button>
          )}
          <div className="tooltip-navigation">
            {index > 0 && (
              <button {...backProps} className="tooltip-button back-button">
                {t('back')}
              </button>
            )}
            <button {...primaryProps} className="tooltip-button primary-button">
              {primaryText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OnboardingTour = () => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('app.onboarding');

  // Comprobar si el usuario ya ha visto el tour - con cuidado de solo hacerlo en el cliente
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialized) {
      try {
        // Verificar explícitamente si existe 'true' como string
        const tourValue = window.localStorage.getItem('hasSeenTour');
        const tourSeen = tourValue === 'true';
        setHasSeenTour(tourSeen);
        setInitialized(true);
        
        // Si el valor no es válido, establecerlo como falso
        if (tourValue !== 'true' && tourValue !== null) {
          window.localStorage.setItem('hasSeenTour', 'false');
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        setHasSeenTour(false);
        setInitialized(true);
      }
    }
  }, [initialized]);

  // Manejar la visualización del tour basado en la ruta y el estado
  useEffect(() => {
    // Solo proceder si ya se inicializó el estado
    if (!initialized) return;
    
    // Check if we're on the dashboard page
    const isDashboard = pathname === '/dashboard' || pathname.endsWith('/dashboard');
    
    // Solo mostrar el tour si estamos en el dashboard Y el usuario no lo ha visto antes
    if (isDashboard && !hasSeenTour) {
      // Pequeño retraso para asegurar que los elementos están montados
      const timer = setTimeout(() => setRun(true), 500);
      return () => clearTimeout(timer);
    } else {
      setRun(false);
    }
  }, [pathname, hasSeenTour, initialized]);

  // Set up mobile view detection separately to avoid re-running the tour effect
  useEffect(() => {
    // Set initial mobile state
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      setIsMobileView(isMobile);
    };
    
    // Initialize and add listener
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para iniciar el tour manualmente - necesaria para eventos internos
  const startTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  // Registrar el evento para iniciar el tour desde fuera
  useEffect(() => {
    const handleStartTour = () => {
      startTour();
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('start-onboarding-tour', handleStartTour);
      return () => {
        document.removeEventListener('start-onboarding-tour', handleStartTour);
      };
    }
  }, []);

  // Crear la traducción con el formato correcto
  const getNextWithProgressText = (step: number, totalSteps: number) => {
    const text = t('nextWithProgress');
    return text.replace('{step}', String(step)).replace('{steps}', String(totalSteps));
  };

  // Add CSS for menu transitions and tooltip styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .menu-transitioning .sm\\:hidden {
        transition: all 0.5s ease-in-out !important;
      }
      
      .tour-menu-open {
        overflow: hidden;
      }
      
      /* Estilos para el tooltip personalizado */
      .custom-tooltip {
        background-color: #FFFFFF;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        color: #374151;
        font-size: 14px;
        max-width: 90vw;
        padding: 16px;
        width: auto;
      }
      
      .tooltip-content {
        margin-bottom: 16px;
      }
      
      .tooltip-footer {
        display: flex;
        justify-content: space-between;
      }
      
      .tooltip-buttons {
        display: flex;
        justify-content: space-between;
        width: 100%;
      }
      
      .tooltip-navigation {
        display: flex;
        gap: 8px;
      }
      
      .tooltip-button {
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        padding: 8px 16px;
      }
      
      .skip-button {
        background-color: transparent;
        color: #6B7280;
      }
      
      .back-button {
        background-color: #E5E7EB;
        color: #374151;
      }
      
      .primary-button {
        background-color: #3B82F6;
        color: white;
      }
      
      @media (max-width: 640px) {
        .custom-tooltip {
          max-width: 90vw;
          width: 90vw;
          padding: 12px;
        }
        
        .tooltip-buttons {
          flex-direction: column;
          gap: 8px;
        }
        
        .tooltip-navigation {
          justify-content: space-between;
          width: 100%;
        }
        
        .skip-button {
          align-self: center;
          margin-bottom: 8px;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Desktop steps
  const desktopSteps: Step[] = [
    {
      target: 'body',
      content: t('welcome'),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.theme-button',
      content: t('theme'),
      placement: 'bottom',
    },
    {
      target: '.create-list-button',
      content: t('createList'),
      placement: 'bottom',
    },
    {
      target: '.categories-button',
      content: t('categories'),
      placement: 'bottom',
    },
    {
      target: '.settings-button',
      content: t('settings'),
      placement: 'bottom',
    },
    {
      target: '.profile-button',
      content: t('profile'),
      placement: 'bottom',
    },
    {
      target: '.logout-button',
      content: t('logout'),
      placement: 'bottom',
    }
  ];

  // Mobile steps - Simplified to make it more reliable
  const mobileSteps: Step[] = [
    {
      target: 'body',
      content: t('welcome'),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[aria-label="Open menu"]',
      content: t('openMenu'),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.mobile-dashboard-link',
      content: t('createList'),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.mobile-categories-link',
      content: t('categories'),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.mobile-settings-link',
      content: t('settings'),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.mobile-profile-link',
      content: t('profile'),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.mobile-logout-link',
      content: t('logout'),
      placement: 'bottom',
      disableBeacon: true,
    }
  ];

  // Open mobile menu with smooth animation
  const openMobileMenu = () => {
    if (menuOpen) return; // Already open

    const menuButton = document.querySelector('[aria-label="Open menu"]') as HTMLButtonElement;
    if (menuButton) {
      document.body.classList.add('menu-transitioning');
      document.body.classList.add('tour-menu-open');
      menuButton.click();
      setMenuOpen(true);
      
      // Remove transition class after animation completes
      setTimeout(() => {
        document.body.classList.remove('menu-transitioning');
      }, 500);
    }
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    if (!menuOpen) return; // Already closed

    const closeButton = document.querySelector('[aria-label="Close menu"]') as HTMLButtonElement;
    if (closeButton) {
      document.body.classList.add('menu-transitioning');
      closeButton.click();
      setMenuOpen(false);
      document.body.classList.remove('tour-menu-open');
      
      // Remove transition class after animation completes
      setTimeout(() => {
        document.body.classList.remove('menu-transitioning');
      }, 500);
    }
  };

  // Check if an element exists and is visible
  const isElementMounted = (selector: string) => {
    const element = document.querySelector(selector);
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  };

  // Handle Joyride events
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;
    
    // Para depuración
    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.log(`Target not found for step ${index}`);
    }
    
    // Navegación específica para botón Atrás
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
      // Cuando se presiona el botón Atrás
      const prevIndex = index - 1;
      
      // Manejo especial para la navegación hacia atrás en móvil
      if (isMobileView) {
        // Si estamos en pasos del menú y vamos a volver al paso del botón de menú
        if (index >= 2 && prevIndex === 1) {
          // Cerrar el menú antes de ir al paso del botón de menú
          closeMobileMenu();
          setTimeout(() => {
            setStepIndex(prevIndex);
          }, 1);
          return;
        }
        
        // Si estamos en los pasos dentro del menú, asegurarnos que esté abierto
        if (prevIndex >= 2) {
          if (!menuOpen) {
            openMobileMenu();
          }
          setTimeout(() => {
            setStepIndex(prevIndex);
          }, 1);
          return;
        }
      }
      
      // Navegación hacia atrás normal
      setStepIndex(prevIndex);
      return;
    }
    
    // Handle step transitions for mobile
    if (isMobileView) {
      // Welcome step (index 0)
      if (type === EVENTS.STEP_BEFORE && index === 0) {
        closeMobileMenu();
      }
      
      // Menu button step (index 1)
      if (type === EVENTS.STEP_BEFORE && index === 1) {
        closeMobileMenu();
      }
      
      // After showing menu button, open the menu automatically
      if (type === EVENTS.STEP_AFTER && index === 1) {
        setTimeout(() => {
          openMobileMenu();
          // Advance to next step after menu is open
          setTimeout(() => {
            setStepIndex(2);
          }, 1);
        }, 1);
        return; // Don't advance automatically
      }
      
      // Menu links steps (index 2-6)
      if (type === EVENTS.STEP_BEFORE && index >= 2 && index <= 6) {
        if (!menuOpen) {
          openMobileMenu();
          // Pequeña pausa para asegurar que el menú está abierto
          return;
        }
      }
      
      // Last step (logout) - finish tour and close menu
      if (type === EVENTS.STEP_AFTER && index === 6) {
        setRun(false);
        localStorage.setItem('hasSeenTour', 'true');
        setHasSeenTour(true);
        closeMobileMenu();
        return;
      }
    }
    
    // Handle standard step navigation for Next button
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      // Skip automatic advancement for specific steps in mobile
      if (isMobileView && index === 1) return;
      
      setStepIndex(index + 1);
      return;
    }
    
    // Handle tour completion - asegurar que se guarda correctamente
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      // Guardar explícitamente como string 'true'
      try {
        window.localStorage.setItem('hasSeenTour', 'true');
        setHasSeenTour(true);
      } catch (error) {
        console.error('Error setting localStorage:', error);
      }
      
      // Clean up
      if (isMobileView && menuOpen) {
        closeMobileMenu();
      }
    }
    
    // Handle target not found errors
    if (type === EVENTS.TARGET_NOT_FOUND) {
      if (isMobileView) {
        // Menu items not found - try to open menu
        if (index >= 2 && index <= 6 && !menuOpen) {
          openMobileMenu();
          setTimeout(() => {
            // Check if target exists after opening menu
            const targetExists = isElementMounted(mobileSteps[index].target as string);
            if (targetExists) {
              setStepIndex(index); // Retry same step
            } else {
              console.log(`Target still not found after opening menu: ${mobileSteps[index].target}`);
              // Intentar de nuevo después de más tiempo
              setTimeout(() => {
                setStepIndex(index);
              }, 500);
            }
          }, 500);
        }
        // Menu button not found - skip to next step
        else if (index === 1) {
          setStepIndex(index + 1);
        }
      } else {
        // En escritorio, intentar volver a intentarlo una vez más
        console.log(`Desktop target not found for step ${index}: ${desktopSteps[index].target}`);
        setTimeout(() => {
          setStepIndex(index);
        }, 500);
      }
    }
  };

  return (
    <Joyride
      steps={isMobileView ? mobileSteps : desktopSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      hideCloseButton
      disableScrolling
      disableOverlayClose
      tooltipComponent={CustomTooltip}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#3B82F6',
          arrowColor: '#FFFFFF',
        },
        spotlight: {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }
      }}
    />
  );
};

// Exportamos la función para iniciar el tour
export const startOnboardingTour = () => {
  // Buscar la instancia del tour en el DOM
  const tourInstance = document.querySelector('.react-joyride__overlay');
  if (tourInstance) {
    // Si existe, intentar iniciar el tour a través de un evento personalizado
    const event = new CustomEvent('start-onboarding-tour');
    document.dispatchEvent(event);
  } else {
    console.warn('Tour component not found in the DOM');
  }
}; 
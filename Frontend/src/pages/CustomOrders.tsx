import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundGlow from '../components/BackgroundGlow';
import AnimatedTitle from '../components/AnimatedTitle';
import Tooltip from '../components/Tooltip';
import { 
  IoArrowForwardOutline, 
  IoArrowBackOutline, 
  IoLogoWhatsapp, 
  IoBrushOutline, 
  IoResizeOutline, 
  IoChatbubbleEllipsesOutline,
  IoPersonOutline,
  IoMailOutline,
  IoColorPaletteOutline
} from 'react-icons/io5';

export const CustomOrders: React.FC = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [theme, setTheme] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 3;
  const maferWhatsappNumber = '584121234567'; // WhatsApp de Mafer (actualizado según requerimiento)

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('Por favor, ingresa tu nombre.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Por favor, ingresa un correo electrónico válido.');
        return;
      }
    }
    if (step === 2) {
      if (!theme.trim()) {
        setError('Por favor, especifica la temática del diseño.');
        return;
      }
      if (!color.trim()) {
        setError('Por favor, especifica el color dominante.');
        return;
      }
    }
    if (step === 3) {
      if (!size.trim()) {
        setError('Por favor, ingresa las dimensiones del acrílico.');
        return;
      }
      if (!comments.trim()) {
        setError('Por favor, ingresa una descripción para tu pedido.');
        return;
      }
    }
    
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !theme.trim() || !color.trim() || !size.trim() || !comments.trim()) {
      setError('Por favor, completa todos los campos requeridos.');
      return;
    }

    // Compilar el mensaje de WhatsApp pre-redactado de forma estructurada
    const message = `Hola Mafer, me gustaría solicitar un diseño personalizado para acrílico:
• *Nombre:* ${name.trim()}
• *Correo:* ${email.trim()}
• *Temática:* ${theme.trim()}
• *Color Dominante:* ${color.trim()}
• *Dimensiones (Ancho x Alto):* ${size.trim()}
• *Descripción del Pedido:* ${comments.trim()}`;

    const whatsappUrl = `https://wa.me/${maferWhatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Abrir WhatsApp en pestaña nueva
    window.open(whatsappUrl, '_blank');
  };

  // Variantes de animación para deslizamiento entre pasos
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' as const }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' as const }
    })
  };

  // Dirección de animación basado en el paso actual
  const direction = step;

  return (
    <div className="custom-orders-container">
      <BackgroundGlow />

      <div className="custom-orders-card">
        {/* Header */}
        <div className="custom-orders-header">
          <AnimatedTitle
            text="Pedidos Personalizados"
            className="custom-orders-title"
          />
          <p className="custom-orders-subtitle">
            Diseñamos vectores a tu medida. Completa las especificaciones de tu proyecto y coordina directamente con Mafer en WhatsApp.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="custom-stepper-container">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const currentStep = idx + 1;
            const active = currentStep <= step;
            return (
              <React.Fragment key={currentStep}>
                <div className="custom-step-wrapper">
                  <motion.div
                    className={`custom-step-circle ${active ? 'active' : ''}`}
                    animate={{ scale: active ? 1.05 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {currentStep}
                  </motion.div>
                  <span className={`custom-step-label step-label-responsive ${active ? 'active' : ''}`}>
                    {currentStep === 1 ? 'Contacto' : currentStep === 2 ? 'Diseño' : 'Especificaciones'}
                  </span>
                </div>
                {currentStep < totalSteps && (
                  <div className="custom-step-line-container">
                    <div 
                      className="custom-step-line"
                      style={{
                        width: step > currentStep ? '100%' : '0%',
                      }} 
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="custom-error-alert"
          >
            {error}
          </motion.div>
        )}

        {/* Step Content */}
        <div className="custom-step-content-wrapper">
          <form onSubmit={handleSubmit} className="custom-form">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="custom-step-container"
                >
                  {/* Nombre del cliente */}
                  <div className="custom-input-group">
                    <label className="custom-label">Nombre Completo</label>
                    <Tooltip content="Ingresa tu nombre completo para identificar tu orden." position="top">
                      <div className="custom-input-wrapper">
                        <IoPersonOutline className="custom-input-icon" />
                        <input
                          type="text"
                          className="input-premium"
                          placeholder="Ej. Pedro Pérez"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </Tooltip>
                  </div>

                  {/* Correo */}
                  <div className="custom-input-group" style={{ marginTop: '10px' }}>
                    <label className="custom-label">Correo Electrónico</label>
                    <Tooltip content="Se utilizará para enviarte adelantos o copias del vector." position="top">
                      <div className="custom-input-wrapper">
                        <IoMailOutline className="custom-input-icon" />
                        <input
                          type="email"
                          className="input-premium"
                          placeholder="ejemplo@correo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </Tooltip>
                  </div>

                  <p className="custom-step-help-text">
                    Comencemos por tu información de contacto para poder agendar tu solicitud.
                  </p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="custom-step-container"
                >
                  {/* Temática del diseño */}
                  <div className="custom-input-group">
                    <label className="custom-label">Temática del Diseño</label>
                    <Tooltip content="¿De qué trata tu diseño? (Ej. Lámpara Naruto, Letrero de Pizza, Placa de Reconocimiento)." position="top">
                      <div className="custom-input-wrapper">
                        <IoBrushOutline className="custom-input-icon" />
                        <input
                          type="text"
                          className="input-premium"
                          placeholder="Ej. Lámpara Acrílica Spiderman"
                          value={theme}
                          onChange={(e) => setTheme(e.target.value)}
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </Tooltip>
                  </div>

                  {/* Color dominante */}
                  <div className="custom-input-group" style={{ marginTop: '10px' }}>
                    <label className="custom-label">Color Dominante</label>
                    <Tooltip content="Color principal que deseas para el diseño o luces LED de la base." position="top">
                      <div className="custom-input-wrapper">
                        <IoColorPaletteOutline className="custom-input-icon" />
                        <input
                          type="text"
                          className="input-premium"
                          placeholder="Ej. Azul Neón, RGB, Transparente"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </Tooltip>
                  </div>

                  <p className="custom-step-help-text">
                    Define el estilo visual del vector y los colores preferidos para estructurar los trazados.
                  </p>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="custom-step-container"
                >
                  {/* Dimensiones */}
                  <div className="custom-input-group">
                    <label className="custom-label">Dimensiones del Acrílico (Ancho x Alto)</label>
                    <Tooltip content="Escribe las dimensiones aproximadas que requieres (Ej. 20x30 cm, 30x40 cm)." position="top">
                      <div className="custom-input-wrapper">
                        <IoResizeOutline className="custom-input-icon" />
                        <input
                          type="text"
                          className="input-premium"
                          placeholder="Ej. 25x30 cm"
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </Tooltip>
                  </div>

                  {/* Descripción del pedido */}
                  <div className="custom-input-group" style={{ marginTop: '10px' }}>
                    <label className="custom-label">Descripción del Pedido</label>
                    <Tooltip content="Describe encajes, espesor del acrílico (Ej. 3mm o 5mm) o si requiere base LED." position="top">
                      <div className="custom-input-wrapper">
                        <IoChatbubbleEllipsesOutline className="custom-input-icon" style={{ top: '16px' }} />
                        <textarea
                          className="input-premium"
                          placeholder="Ej. Requiere encastres para acrílico de 3mm y grabado de logo con corte en el contorno..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          style={{ paddingLeft: '44px', minHeight: '80px', resize: 'vertical' }}
                        />
                      </div>
                    </Tooltip>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="custom-button-row">
              {step > 1 ? (
                <motion.button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary custom-nav-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IoArrowBackOutline size={18} />
                  Atrás
                </motion.button>
              ) : (
                <div style={{ flex: 1 }} />
              )}

              {step < totalSteps ? (
                <motion.button
                  type="button"
                  onClick={handleNext}
                  className="btn-premium custom-nav-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Siguiente
                  <IoArrowForwardOutline size={18} />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  className="btn-premium custom-nav-btn"
                  style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#fff' }}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(37, 211, 102, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IoLogoWhatsapp size={20} />
                  Enviar Solicitud a WhatsApp
                </motion.button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomOrders;

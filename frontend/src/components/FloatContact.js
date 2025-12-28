import React from "react";

const PHONE_NUMBER = "0335254586";

export default function FloatContact() {
  const zaloHref = `https://zalo.me/${PHONE_NUMBER}`;
  const telHref = `tel:${PHONE_NUMBER}`;

  return (
    <>
      <style>{`
        .rf-float-contact {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          z-index: 9999;
        }

        .rf-contact-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 
                      0 2px 8px rgba(0, 0, 0, 0.08);
          text-decoration: none;
          position: relative;
          border: 3px solid rgba(255, 255, 255, 0.3);
        }

        .rf-contact-btn::after {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          background: inherit;
          opacity: 0;
          z-index: -1;
          transition: all 0.4s ease;
        }

        .rf-contact-btn:hover {
          transform: translateY(-6px) scale(1.1);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2), 
                      0 6px 16px rgba(0, 0, 0, 0.12);
        }

        .rf-contact-btn:hover::after {
          opacity: 0.2;
          inset: -4px;
        }

        .rf-contact-btn:active {
          transform: translateY(-3px) scale(1.05);
        }

        /* Zalo Button */
        .rf-contact-zalo {
          background: linear-gradient(135deg, #0084FF 0%, #0068FF 100%);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .rf-contact-zalo:hover {
          background: linear-gradient(135deg, #009FFF 0%, #0084FF 100%);
        }

        .rf-zalo-inner {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 50%;
          padding: 10px;
        }

        .rf-zalo-logo {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0084FF 0%, #0068FF 100%);
          border-radius: 50%;
          position: relative;
        }

        .rf-zalo-text {
          color: white;
          font-size: 16px;
          font-weight: 700;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          letter-spacing: -0.5px;
        }

        /* Call Button */
        .rf-contact-call {
          background: linear-gradient(135deg, #00E676 0%, #00C853 100%);
          border-color: rgba(255, 255, 255, 0.5);
          animation: pulse-call 2.5s ease-in-out infinite;
        }

        .rf-contact-call:hover {
          background: linear-gradient(135deg, #00FF7F 0%, #00E676 100%);
          animation: none;
        }

        @keyframes pulse-call {
          0%, 100% {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 
                        0 2px 8px rgba(0, 0, 0, 0.08);
          }
          50% {
            box-shadow: 0 4px 16px rgba(0, 200, 83, 0.4), 
                        0 2px 8px rgba(0, 200, 83, 0.3),
                        0 0 0 12px rgba(0, 230, 118, 0.15);
          }
        }

        .rf-call-icon {
          animation: ring 1.5s ease-in-out infinite;
        }

        @keyframes ring {
          0%, 100% {
            transform: rotate(0deg);
          }
          10%, 30% {
            transform: rotate(-15deg);
          }
          20%, 40% {
            transform: rotate(15deg);
          }
          50% {
            transform: rotate(0deg);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .rf-float-contact {
            right: 16px;
            gap: 14px;
          }

          .rf-contact-btn {
            width: 56px;
            height: 56px;
          }

          .rf-zalo-text {
            font-size: 15px;
          }
        }

        @media (max-width: 480px) {
          .rf-float-contact {
            right: 12px;
            gap: 12px;
          }

          .rf-contact-btn {
            width: 52px;
            height: 52px;
          }

          .rf-zalo-text {
            font-size: 14px;
          }
        }
      `}</style>

      <div className="rf-float-contact">
        <a
          className="rf-contact-btn rf-contact-zalo"
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat qua Zalo"
          title="Chat qua Zalo"
        >
          <div className="rf-zalo-inner">
            <div className="rf-zalo-logo">
              <span className="rf-zalo-text">Z</span>
            </div>
          </div>
        </a>

        <a
          className="rf-contact-btn rf-contact-call"
          href={telHref}
          aria-label={`Gọi ${PHONE_NUMBER}`}
          title={`Gọi ${PHONE_NUMBER}`}
        >
          <svg
            className="rf-call-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="26"
            height="26"
            fill="white"
            aria-hidden="true"
          >
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
          </svg>
        </a>
      </div>
    </>
  );
}
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, message: '' }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '' }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const msg = this.state.message

    return (
      <>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0;}
          body{background:#1A2535;min-height:100vh;}
          .eb-page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;background:#1A2535;}
          .eb-brand-name{font-size:28px;font-weight:600;letter-spacing:0.14em;color:#fff;text-transform:uppercase;margin-bottom:36px;text-shadow:0 0 8px rgba(255,255,255,0.9);}
          .eb-card{background:#fff;border:1.5px solid #DDD5C8;border-radius:16px;padding:40px 44px;width:100%;max-width:460px;text-align:center;}
          .eb-badge{display:inline-flex;align-items:center;justify-content:center;padding:8px 20px;border-radius:999px;font-size:22px;font-weight:700;background:#FEF3C7;color:#D97706;margin-bottom:20px;}
          .eb-title{font-size:20px;font-weight:700;color:#0B2545;margin-bottom:10px;}
          .eb-desc{font-size:14px;color:#4A5568;line-height:1.65;margin-bottom:16px;}
          .eb-detail{font-size:11px;color:#9CA3AF;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:10px 12px;margin-bottom:24px;text-align:left;word-break:break-word;font-family:monospace;}
          .eb-btn{padding:12px 28px;font-size:14px;font-weight:600;background:#0B2545;color:#fff;border:none;border-radius:9px;cursor:pointer;font-family:inherit;}
          .eb-btn:hover{background:#1a3a60;}
          @media(max-width:600px){.eb-card{padding:28px 22px;}}
        `}</style>
        <div className="eb-page">
          <div className="eb-brand-name">NeuroTrack</div>
          <div className="eb-card">
            <div className="eb-badge">⚠ Error inesperado</div>
            <div className="eb-title">Algo salió mal</div>
            <div className="eb-desc">
              Ocurrió un error inesperado en la aplicación. Recarga la página para continuar.
            </div>
            {msg && (
              <div className="eb-detail">{msg}</div>
            )}
            <button className="eb-btn" onClick={() => window.location.reload()}>
              Recargar página
            </button>
          </div>
        </div>
      </>
    )
  }
}

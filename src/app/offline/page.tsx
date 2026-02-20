export default function OfflinePage() {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Offline — Owen Zen</title>
                <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #030303;
            color: #f5f5f5;
            font-family: system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            padding: 24px;
          }
          .container { max-width: 400px; }
          .icon {
            width: 80px; height: 80px;
            background: #0a0a0a;
            border: 1px solid #262626;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 36px;
          }
          h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
          p { font-size: 15px; color: #737373; line-height: 1.6; margin-bottom: 28px; }
          button {
            background: #dc2626;
            color: white;
            border: none;
            padding: 12px 28px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          button:hover { opacity: 0.85; }
        `}</style>
            </head>
            <body>
                <div className="container">
                    <div className="icon">⚡</div>
                    <h1>You&apos;re Offline</h1>
                    <p>
                        Owen Zen couldn&apos;t reach the server. Check your connection and try again.
                        Your locally cached pages are still available.
                    </p>
                    <button onClick={() => window.location.reload()}>
                        Try Again
                    </button>
                </div>
            </body>
        </html>
    );
}

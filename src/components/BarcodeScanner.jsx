import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import './BarcodeScanner.css'

function BarcodeScanner({ onScanSuccess, onScanError, enabled = true }) {
    const scannerRef = useRef(null)
    const html5QrCodeRef = useRef(null)
    const [cameraError, setCameraError] = useState('')
    const [isScanning, setIsScanning] = useState(false)

    useEffect(() => {
        if (!enabled) return

        const scannerId = 'barcode-scanner-region'
        const html5QrCode = new Html5Qrcode(scannerId)
        html5QrCodeRef.current = html5QrCode

        const config = {
            fps: 10,
            qrbox: { width: 280, height: 120 },
            aspectRatio: 1.0,
            formatsToSupport: [
                0,  // QR_CODE
                2,  // CODE_39
                4,  // CODE_128
                6,  // EAN_13
                7,  // EAN_8
                9,  // UPC_A
                10, // UPC_E
                13, // CODE_93
                11, // ITF
            ]
        }

        const onSuccess = (decodedText) => {
            // Pause scanning briefly after a successful scan
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.pause(true)
                onScanSuccess(decodedText)

                // Resume scanning after 2 seconds
                setTimeout(() => {
                    if (html5QrCodeRef.current) {
                        try {
                            html5QrCodeRef.current.resume()
                        } catch (e) {
                            // Scanner may have been stopped
                        }
                    }
                }, 2000)
            }
        }

        const onError = (errorMessage) => {
            // Ignore "no code found" errors — they fire every frame
        }

        // Start with environment (back) camera
        html5QrCode.start(
            { facingMode: 'environment' },
            config,
            onSuccess,
            onError
        ).then(() => {
            setIsScanning(true)
            setCameraError('')
        }).catch((err) => {
            console.error('Camera start error:', err)
            setCameraError('Could not access camera. Please allow camera permissions and ensure you are on HTTPS.')
            if (onScanError) onScanError(err.toString())
        })

        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(() => { })
            }
        }
    }, [enabled])

    return (
        <div className="barcode-scanner-wrapper">
            {cameraError ? (
                <div className="scanner-error">
                    <span className="scanner-error-icon">📷</span>
                    <p>{cameraError}</p>
                </div>
            ) : (
                <>
                    <div className="scanner-viewport">
                        <div id="barcode-scanner-region" ref={scannerRef}></div>
                        {isScanning && <div className="scanner-laser"></div>}
                    </div>
                    <p className="scanner-hint">
                        Point camera at the barcode on the ID card
                    </p>
                </>
            )}
        </div>
    )
}

export default BarcodeScanner

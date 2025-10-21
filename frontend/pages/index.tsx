import { useState, useRef } from 'react'
import Head from 'next/head'
import { Button } from '@/components/ui/button'
import { Upload, Camera, Loader2, AlertTriangle, Shield, ShieldCheck, RotateCcw } from 'lucide-react'

interface SnakeResult {
  status: string
  description: string
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null)
  const [result, setResult] = useState<SnakeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
        identifySnake(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const identifySnake = async (imageData: string) => {
    setLoading(true)
    try {
      const response = await fetch('https://42znlandtww7wnpuarx5dy2rt40kajds.lambda-url.us-east-1.on.aws/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData.split(',')[1] })
      })
      
      const data = await response.json()
      setResult({
        status: data.status || 'Unknown',
        description: data.description || 'Unable to identify snake'
      })
    } catch (error) {
      setResult({
        status: 'Unknown',
        description: 'Error identifying snake. Please try again.'
      })
    }
    setLoading(false)
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Venomous':
        return { backgroundColor: '#8b0000', textColor: '#ffffff', icon: AlertTriangle }
      case 'Mildly Venomous':
        return { backgroundColor: '#ffd700', textColor: '#000000', icon: Shield }
      case 'Not Venomous':
        return { backgroundColor: '#228b22', textColor: '#000000', icon: ShieldCheck }
      default:
        return { backgroundColor: '#6b7280', textColor: '#ffffff', icon: Shield }
    }
  }

  const triggerCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode }
      })
        .then(mediaStream => {
          setStream(mediaStream)
          setShowCamera(true)
          // Use setTimeout to ensure video element is rendered
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream
              videoRef.current.play()
            }
          }, 100)
        })
        .catch(() => {
          fileInputRef.current?.click()
        })
    } else {
      fileInputRef.current?.click()
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && stream) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      
      ctx?.drawImage(videoRef.current, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg')
      setImage(imageData)
      identifySnake(imageData)
      
      // Stop camera and hide preview
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setShowCamera(false)
    }
  }

  const flipCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacingMode)
    
    // If camera is currently active, restart with new facing mode
    if (stream && showCamera) {
      stream.getTracks().forEach(track => track.stop())
      
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: newFacingMode }
      })
        .then(mediaStream => {
          setStream(mediaStream)
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream
              videoRef.current.play()
            }
          }, 100)
        })
        .catch(() => {
          setShowCamera(false)
          setStream(null)
        })
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setShowCamera(false)
    }
  }

  const uploadNewImage = () => {
    setImage(null)
    setResult(null)
    setLoading(false)
    fileInputRef.current?.click()
  }

  const statusDisplay = result ? getStatusDisplay(result.status) : null

  return (
    <>
      <Head>
        <title>All about Snakes</title>
        <meta name="description" content="Learn about snake species using AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen p-4" style={{background: 'linear-gradient(to bottom right, #166534, #059669, #d97706)'}}>
        <div className="max-w-sm mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center py-6">
            <h1 className="text-3xl font-bold text-white mb-2">All about Snakes</h1>
            <p className="text-white opacity-90">Discover and learn about snake species</p>
          </div>

          {/* Camera Upload Button - Always Visible */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <div 
              onClick={triggerCamera}
              className="rounded-full cursor-pointer hover:opacity-80 transition-all shadow-lg"
              style={{
                background: 'linear-gradient(to right, #15803d, #d97706)',
                padding: '40px'
              }}
            >
              <Camera style={{height: '80px', width: '80px', color: 'white'}} />
            </div>
            
            <div 
              onClick={flipCamera}
              className="rounded-full cursor-pointer hover:opacity-80 transition-all shadow-lg bg-white/20 backdrop-blur-sm p-3"
            >
              <RotateCcw style={{height: '24px', width: '24px', color: 'white'}} />
            </div>
          </div>
          
          {/* Upload Area, Camera Preview, or Image Display */}
          {showCamera ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play()
                    }
                  }}
                />
              </div>
              <div className="flex justify-center gap-4">
                <div 
                  onClick={capturePhoto}
                  className="rounded-full cursor-pointer hover:opacity-90 transition-all shadow-lg flex flex-col items-center justify-center"
                  style={{
                    background: 'linear-gradient(to right, #15803d, #d97706)',
                    padding: '20px',
                    minWidth: '120px',
                    minHeight: '80px'
                  }}
                >
                  <Camera style={{height: '32px', width: '32px', color: 'white'}} />
                  <span className="text-white text-sm font-semibold mt-1">Take Picture</span>
                </div>
                <Button 
                  onClick={stopCamera}
                  variant="outline"
                  className="px-6 py-3 rounded-full bg-white/90 hover:bg-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : !image ? (
            <div 
              onClick={triggerCamera}
              className="bg-white/90 backdrop-blur-sm border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-white transition-all shadow-lg"
              style={{borderColor: '#22c55e'}}
            >
              <p className="text-gray-700 font-semibold text-lg">Tap anywhere to take photo or upload image</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border-4 border-white shadow-lg bg-white">
                <img 
                  src={image} 
                  alt="Snake" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {loading && (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-green-700" />
                    <span className="ml-3 text-gray-700 font-medium">Analyzing snake...</span>
                  </div>
                </div>
              )}
              
              {result && !loading && (
                <div className="space-y-4">
                  {/* Status Badge */}
                  {statusDisplay && (
                    <div className="flex justify-center">
                      <div 
                        className="px-6 py-3 rounded-full flex items-center gap-2 font-bold text-lg shadow-lg blink-animation"
                        style={{
                          backgroundColor: statusDisplay.backgroundColor, 
                          color: statusDisplay.textColor
                        }}
                      >
                        <statusDisplay.icon className="h-5 w-5" />
                        {result.status}
                      </div>
                    </div>
                  )}
                  
                  {/* Description */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-white/50">
                    <div className="bg-gradient-to-r from-green-50 to-amber-50 rounded-lg p-4 border border-green-300">
                      <p className="text-gray-800 leading-relaxed text-sm">
                        {result.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>
    </>
  )
}

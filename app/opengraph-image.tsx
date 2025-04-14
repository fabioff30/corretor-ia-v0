import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const alt = "CorretorIA - Correção de textos com Inteligência Artificial"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

// Image generation
export default async function Image() {
  // Você pode usar uma imagem externa, mas também estou criando uma versão de fallback
  try {
    // Tentar buscar a imagem externa
    const imageData = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fotocorretoria-EpelXGexOh0tI1v5BSxZk9WJn2zVJW.png",
    ).then((res) => res.arrayBuffer())

    return new ImageResponse(
      <div
        style={{
          display: "flex",
          background: "black",
          width: "100%",
          height: "100%",
        }}
      >
        <img
          src={`data:image/png;base64,${Buffer.from(imageData).toString("base64")}`}
          alt="CorretorIA"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>,
      { ...size },
    )
  } catch (e) {
    // Fallback para uma imagem gerada caso a externa falhe
    return new ImageResponse(
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(to bottom right, #9333ea, #3b82f6)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: "40px",
        }}
      >
        <div style={{ fontSize: "72px", fontWeight: "bold", marginBottom: "20px" }}>CorretorIA</div>
        <div style={{ fontSize: "36px", maxWidth: "80%", textAlign: "center" }}>
          Correção inteligente de textos em português
        </div>
      </div>,
      { ...size },
    )
  }
}

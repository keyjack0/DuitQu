export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#f5f5f5",
        padding: "56px 20px 96px",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                width: "92px",
                height: "12px",
                borderRadius: "999px",
                background: "#161616",
                border: "1px solid #2a2a2a",
                marginBottom: "10px",
              }}
            />
            <div
              style={{
                width: "148px",
                height: "22px",
                borderRadius: "8px",
                background: "#1e1e1e",
              }}
            />
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
            }}
          />
        </div>

        <div
          style={{
            minHeight: "156px",
            borderRadius: "16px",
            background: "#161616",
            border: "1px solid #2a2a2a",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              width: "96px",
              height: "12px",
              borderRadius: "999px",
              background: "#222222",
            }}
          />
          <div
            style={{
              width: "70%",
              height: "34px",
              borderRadius: "10px",
              background: "#1e1e1e",
            }}
          />
          <div style={{ display: "flex", gap: "12px" }}>
            <div
              style={{
                width: "116px",
                height: "30px",
                borderRadius: "8px",
                background: "#1e1e1e",
              }}
            />
            <div
              style={{
                width: "116px",
                height: "30px",
                borderRadius: "8px",
                background: "#1e1e1e",
              }}
            />
          </div>
        </div>

        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            style={{
              height: "64px",
              borderRadius: "10px",
              background: "#161616",
              border: "1px solid #2a2a2a",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#1e1e1e",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  width: "58%",
                  height: "12px",
                  borderRadius: "999px",
                  background: "#1e1e1e",
                  marginBottom: "8px",
                }}
              />
              <div
                style={{
                  width: "34%",
                  height: "10px",
                  borderRadius: "999px",
                  background: "#202020",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

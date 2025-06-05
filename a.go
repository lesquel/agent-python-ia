package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
)

func main() {
	url := "http://localhost:7777/v1/playground/agents/676dd9e1-cfb5-40af-acc8-b59337a7254f/runs"

	// Crear el cuerpo del formulario multipart
	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	// Campos obligatorios
	w.WriteField("message", "hola comp estas")
	w.WriteField("stream", "true")
	w.WriteField("monitor", "false")
	w.WriteField("session_id", "ewrverver")
	w.WriteField("user_id", "vrerkvnerlk")

	// Cerrar el writer para finalizar el cuerpo
	err := w.Close()
	if err != nil {
		fmt.Println("Error cerrando writer:", err)
		return
	}

	// Crear la solicitud HTTP
	req, err := http.NewRequest("POST", url, &b)
	if err != nil {
		fmt.Println("Error creando la solicitud:", err)
		return
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("Accept", "application/json")

	// Enviar la solicitud
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error al enviar la solicitud:", err)
		return
	}
	defer resp.Body.Close()

	// Leer la respuesta
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error al leer la respuesta:", err)
		return
	}

	fmt.Println("Código de respuesta:", resp.StatusCode)
	fmt.Println("Cuerpo de la respuesta:\n", string(body))
}

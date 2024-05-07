package main

import (
    "encoding/json"
    "net/http"
    "sync"

    "github.com/gin-gonic/gin"
    "github.com/gorilla/websocket"
)

type Message struct {
    Type string      `json:"type"`
    Data interface{} `json:"data"`
}

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}

var (
    rooms   = make(map[string]map[*websocket.Conn]string)
    roomsMu sync.Mutex
)

func main() {
    router := gin.Default()

    router.GET("/room", func(c *gin.Context) {
        name := c.Query("name")
        conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
        if err != nil {
            return
        }
        defer conn.Close()

        roomName := "common-room"

        roomsMu.Lock()
        if _, ok := rooms[roomName]; !ok {
            rooms[roomName] = make(map[*websocket.Conn]string)
        }
        rooms[roomName][conn] = name
        roomsMu.Unlock()

        defer func() {
            roomsMu.Lock()
            delete(rooms[roomName], conn)
            roomsMu.Unlock()
            updateRoomUsers(roomName)
        }()

        updateRoomUsers(roomName)

        for {
            _, messageData, err := conn.ReadMessage()
            if err != nil {
                return
            }
            var message Message
            if err := json.Unmarshal(messageData, &message); err != nil {
                return
            }
            broadcast(roomName, message, conn)
        }
    })

    router.POST("/record", func(c *gin.Context) {
        file, _ := c.FormFile("audio")
        c.SaveUploadedFile(file, file.Filename)
        c.JSON(http.StatusOK, gin.H{"status": "success"})
    })

    router.Run(":8080")
}

func broadcast(roomName string, message Message, sender *websocket.Conn) {
    roomsMu.Lock()
    defer roomsMu.Unlock()
    for conn := range rooms[roomName] {
        if conn != sender {
            conn.WriteJSON(message)
        }
    }
}

func updateRoomUsers(roomName string) {
    roomsMu.Lock()
    defer roomsMu.Unlock()
    users := make([]string, 0, len(rooms[roomName]))
    for _, name := range rooms[roomName] {
        users = append(users, name)
    }
    update := Message{
        Type: "update_users",
        Data: users,
    }
    for conn := range rooms[roomName] {
        conn.WriteJSON(update)
    }
}

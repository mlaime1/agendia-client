{
  "success": true,
  "data": {
    "user": {
      "id": "3ef413b7-78f5-4cb4-aff6-0c24693d6458",
      "aud": "authenticated",
      "role": "authenticated",
      "email": "test@test.com",
      "email_confirmed_at": "2026-05-25T20:22:36.597616Z",
      "phone": "",
      "confirmed_at": "2026-05-25T20:22:36.597616Z",
      "last_sign_in_at": "2026-05-28T22:21:42.814026648Z",
      "app_metadata": {
        "provider": "email",
        "providers": [
          "email"
        ]
      },
      "user_metadata": {
        "email_verified": true,
        "name": "exam"
      },
      "identities": [
        {
          "identity_id": "93245dc5-dacb-49fd-ac0d-fc5d86afe40f",
          "id": "3ef413b7-78f5-4cb4-aff6-0c24693d6458",
          "user_id": "3ef413b7-78f5-4cb4-aff6-0c24693d6458",
          "identity_data": {
            "email": "test@test.com",
            "email_verified": false,
            "phone_verified": false,
            "sub": "3ef413b7-78f5-4cb4-aff6-0c24693d6458"
          },
          "provider": "email",
          "last_sign_in_at": "2026-05-25T20:22:36.594685Z",
          "created_at": "2026-05-25T20:22:36.594709Z",
          "updated_at": "2026-05-25T20:22:36.594709Z",
          "email": "test@test.com"
        }
      ],
      "created_at": "2026-05-25T20:22:36.592971Z",
      "updated_at": "2026-05-28T22:21:42.8168Z",
      "is_anonymous": false
    },
    "session": {
      "access_token": "eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiIzZWY0MTNiNy03OGY1LTRjYjQtYWZmNi0wYzI0NjkzZDY0NTgiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgwMDEwNTAyLCJpYXQiOjE3ODAwMDY5MDIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJleGFtIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3ODAwMDY5MDJ9XSwic2Vzc2lvbl9pZCI6IjQ3ZThiODUxLTcyNzctNGU3Ni1hYmMzLWM5ODdkNGJlNzA3ZiIsImlzX2Fub255bW91cyI6ZmFsc2V9.CZHTRlq6-cJ3Je2rA-N65GyYpgBlshinA5D1v9ALAMs6SLlKbszj1GaKitMQ2seRDEjIF5FE6Ke5WNDMK1P9Hg",
      "token_type": "bearer",
      "expires_in": 3600,
      "expires_at": 1780010502,
      "refresh_token": "qxbs7h3kuxvp",
      "user": {
        "id": "3ef413b7-78f5-4cb4-aff6-0c24693d6458",
        "aud": "authenticated",
        "role": "authenticated",
        "email": "test@test.com",
        "email_confirmed_at": "2026-05-25T20:22:36.597616Z",
        "phone": "",
        "confirmed_at": "2026-05-25T20:22:36.597616Z",
        "last_sign_in_at": "2026-05-28T22:21:42.814026648Z",
        "app_metadata": {
          "provider": "email",
          "providers": [
            "email"
          ]
        },
        "user_metadata": {
          "email_verified": true,
          "name": "exam"
        },
        "identities": [
          {
            "identity_id": "93245dc5-dacb-49fd-ac0d-fc5d86afe40f",
            "id": "3ef413b7-78f5-4cb4-aff6-0c24693d6458",
            "user_id": "3ef413b7-78f5-4cb4-aff6-0c24693d6458",
            "identity_data": {
              "email": "test@test.com",
              "email_verified": false,
              "phone_verified": false,
              "sub": "3ef413b7-78f5-4cb4-aff6-0c24693d6458"
            },
            "provider": "email",
            "last_sign_in_at": "2026-05-25T20:22:36.594685Z",
            "created_at": "2026-05-25T20:22:36.594709Z",
            "updated_at": "2026-05-25T20:22:36.594709Z",
            "email": "test@test.com"
          }
        ],
        "created_at": "2026-05-25T20:22:36.592971Z",
        "updated_at": "2026-05-28T22:21:42.8168Z",
        "is_anonymous": false
      },
      "weak_password": null
    }
  }
}


http://localhost:3000/users/me

{
  "success": true,
  "data": {
    "id": "1",
    "created_at": "2026-05-25T20:22:36.698Z",
    "name": "exam",
    "email": "test@test.com",
    "alias": null,
    "role": "DRIVER",
    "type": "driver"
  }
}
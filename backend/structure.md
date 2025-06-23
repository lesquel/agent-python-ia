backend/
│
├── app/
│   ├── main.py                   # Punto de entrada de la app principal
│   ├── core/                     # Configuración y lógica global
│   │   ├── config.py             # Variables de entorno, settings
│   │   └── security.py           # Seguridad y autenticación
│   ├── db/                       # Conexión a MongoDB y utilidades
│   │   ├── database.py           # Cliente MongoDB, inicialización, conexión
│   │   └── utils.py              # Funciones auxiliares para DB (opcional)
│   ├── modules/                  # Cada módulo es una funcionalidad del dominio
│   │   ├── agent/
│   │   │   ├── models.py         # Modelos MongoDB o Pydantic (Beanie, Motor, etc.)
│   │   │   ├── schemas.py        # Schemas para request/response
│   │   │   ├── services.py       # Lógica de negocio/CRUD
│   │   │   └── routes.py         # Rutas de agente con FastAPI Router
│   │   ├── user/
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── services.py
│   │   │   └── routes.py
│   │   └── __init__.py          # (opcional) para facilitar imports
│   └── agnos/                    # Subaplicación Agnos montada
│       ├── __init__.py
│       ├── api.py                # Instancia FastAPI de Agnos
│       ├── routes.py             # Rutas de Agnos
│       └── utils/                # Funciones auxiliares de Agnos
│
├── .env
├── requirements.txt
└── README.md

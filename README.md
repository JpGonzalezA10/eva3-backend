# EVA3 Backend

Evaluación Parcial N°3 — ISY1101 Introducción a Herramientas DevOps — Duoc UC

## Descripción

API REST en Node.js/Express que expone datos de ejemplo, desplegada en un clúster
Amazon EKS como parte de la práctica de orquestación y automatización en la nube.

## Arquitectura

- **Infraestructura:** VPC dedicada (10.0.0.0/16) con subredes públicas en 2 AZ
  (us-east-1a, us-east-1b), creada mediante el asistente "VPC and more" de la
  consola AWS.
- **Build:** una instancia EC2 (t3.medium, Amazon Linux 2023) actúa como servidor
  de build, con Docker, Git, kubectl y AWS CLI instalados. Usa el perfil de
  instancia `LabInstanceProfile` para autenticarse automáticamente con `LabRole`.
- **Registro de imágenes:** Amazon ECR (`eva3-backend`).
- **Orquestación:** clúster Amazon EKS (`eva3-cluster`), creado 100% desde la
  consola AWS, con un Managed Node Group de 2 a 4 instancias `t3.medium`. Tanto el
  rol de IAM del clúster como el del nodo usan `LabRole`, ya que AWS Academy
  Learner Lab no permite crear roles IAM personalizados.
- **Despliegue:** Deployment de 2 réplicas, expuesto internamente mediante un
  Service de tipo `ClusterIP` (`backend-service`), accesible solo dentro del
  clúster vía DNS interno de Kubernetes.
- **Autoscaling:** HorizontalPodAutoscaler configurado con un umbral de 50% de
  CPU (min 2, max 6 réplicas).

## Endpoints

| Método | Ruta          | Descripción                          |
|--------|---------------|---------------------------------------|
| GET    | `/api/health` | Healthcheck del servicio              |
| GET    | `/api/data`   | Retorna un mensaje de ejemplo en JSON |

## Cómo correr localmente

```bash
npm install
npm start
```

## Cómo construir y desplegar manualmente

```bash
docker build -t eva3-backend .
docker tag eva3-backend:latest <ECR_URI>:latest
docker push <ECR_URI>:latest
kubectl set image deployment/backend backend=<ECR_URI>:latest
kubectl rollout status deployment/backend
```

## CI/CD

El workflow `.github/workflows/deploy.yml` automatiza:
**build → push a ECR → deploy en EKS** en cada push a la rama `main`.

## Problemas encontrados y solución

1. **Credenciales temporales de AWS Academy Learner Lab:** las credenciales
   (`access key`, `secret key`, `session token`) expiran junto con la sesión del
   lab (aprox. 4 horas) y se invalidan con una política de denegación explícita
   (`voc-cancel-cred`). Esto provoca que el pipeline de GitHub Actions falle con
   un error de autorización si los Secrets del repositorio no se actualizan
   manualmente al iniciar cada nueva sesión de trabajo.
2. **Error `tls: internal error` en `kubectl logs`:** se detectó un error de
   comunicación TLS entre el API server de EKS y el kubelet de los nodos,
   afectando `kubectl logs`, `kubectl exec` y el *readiness probe* de
   metrics-server. Se descartó como causa un desfase de reloj (verificado con
   `date`) y una restricción de Security Groups (se agregó una regla explícita
   permitiendo el puerto 10250 sin que el problema se resolviera). Se concluye
   que es una limitación propia del entorno AWS Academy Learner Lab en la
   gestión/rotación de certificados de kubelet bajo credenciales temporales. Como
   alternativa, se validó el funcionamiento del backend mediante pods de prueba
   (`kubectl run` + `curl`), confirmando respuestas exitosas (estado `Completed`).
3. **HPA sin métricas:** como consecuencia del punto anterior, metrics-server no
   pasa su *readiness check*, por lo que el HPA no recibe datos reales de CPU. El
   HPA queda correctamente configurado y documentado, mostrando `<unknown>` en el
   valor de métrica actual por la limitación descrita.

## Autor

JP González A. — ISY1101, Duoc UC

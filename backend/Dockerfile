# ============================================================
# Stage 1: Build
# ============================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Cache dependencies first — set HTTP timeouts to avoid Maven Central stalls
ENV MAVEN_OPTS="-Dmaven.wagon.http.connectionTimeout=30000 \
                -Dmaven.wagon.http.readTimeout=120000 \
                -Dmaven.wagon.httpconnectionManager.maxPerRoute=20"
COPY pom.xml .
RUN mvn dependency:go-offline -B \
      -Dmaven.wagon.http.retryHandler.count=3

# Copy source and build
COPY src ./src
RUN mvn package -DskipTests -B

# ============================================================
# Stage 2: Runtime
# ============================================================
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=docker", "app.jar"]

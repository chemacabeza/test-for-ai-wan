FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Create non-root user (Debian style)
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

# Safely copy the natively compiled host jar file explicitly bypassing docker networking
COPY target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Djava.net.preferIPv4Stack=true", "-Djava.net.preferIPv6Addresses=false", "-Dio.netty.java.net.preferIPv4Stack=true", "-Dspring.profiles.active=docker", "app.jar"]

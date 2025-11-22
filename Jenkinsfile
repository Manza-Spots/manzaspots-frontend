pipeline {
    agent any

    environment {
        PROJECT_NAME = "manza-spots"
        AWS_REGION = "us-east-2"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                echo "Instalando dependencias del proyecto..."
                sh 'echo Aquí irían los comandos para instalar dependencias'
            }
        }

        stage('Run tests') {
            steps {
                echo "Ejecutando pruebas (placeholder)..."
                sh 'echo Aquí irían los tests'
            }
        }

        stage('Build') {
            when {
                branch 'develop'
            }
            steps {
                echo "Build ambiente DEV"
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo "Desplegando a PRODUCCIÓN"
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline ejecutado con éxito"
        }
        failure {
            echo "❌ Falló el pipeline"
        }
    }
}
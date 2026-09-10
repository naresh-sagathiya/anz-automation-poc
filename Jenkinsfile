pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Install Playwright Browsers') {
            steps {
                bat 'npx playwright install chromium'
            }
        }

        stage('Run Web Tests') {
            steps {
                bat 'npm run test:web -- --tags "@account-number-visibility"'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'reports/**/*,allure-results/**/*',
                             allowEmptyArchive: true
        }
    }
}
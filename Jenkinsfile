pipeline {
    agent any

    tools {
        maven 'Maven 3.x'
        jdk 'JDK 21'
    }

    stages {
        stage('Checkout eLibrary Code') {
            steps {
                // Pulls code from your elibrary-automation repository
                checkout scm
            }
        }

        stage('Compile Test Suite') {
            steps {
                sh 'mvn clean compile test-compile'
            }
        }

        stage('Execute eLibrary Tests') {
            steps {
                // Run your specific test suite (e.g., TestNG suite xml or maven profile)
                sh 'mvn test -Dsurefire.useFile=false'
            }
        }
    }

    post {
        always {
            // Archive TestNG/Surefire XML reports
            junit 'target/surefire-reports/*.xml'
        }
        success {
            echo 'eLibrary automation test suite executed successfully!'
        }
        failure {
            echo 'eLibrary pipeline failed. Review the console logs for failures.'
        }
    }
}

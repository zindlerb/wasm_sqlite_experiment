#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

void *lstat_test_threaded( void *ptr ) {
    struct stat buffer;
    int status;
    status = lstat("/persistent/db", &buffer);
    printf("status %d\n", status);
}

int lstat_test_with_thread() {
    pthread_t thread1;
    int iret1;
    iret1 = pthread_create( &thread1, NULL, lstat_test_threaded, NULL);
    pthread_join(thread1, NULL);
    return 0;
}

int lstat_test() {
    struct stat buffer;
    int status;
    status = lstat("/persistent/db", &buffer);
    printf("status %d\n", status);
    return 0;
}

#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <stdio.h>

int lstat_test() {
    struct stat buffer;
    int status;
    status = lstat("/persistent/db", &buffer);
    printf("status %d\n", status);
    return 0;
}

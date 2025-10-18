#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <openssl/md5.h>

#define BUFFER_SIZE 8192

void print_hash(const unsigned char *hash, size_t length) {
    for (size_t i = 0; i < length; i++) {
        printf("%02x", hash[i]);
    }
}


void calculate_md5_stream(FILE *stream, const char *stream_name, unsigned char *hash) {
    MD5_CTX md5Context;
    if (!MD5_Init(&md5Context)) {
        fprintf(stderr, "Error: MD5_Init failed.\n");
        exit(EXIT_FAILURE);
    }

    unsigned char buffer[BUFFER_SIZE];
    size_t bytesRead;

    while ((bytesRead = fread(buffer, 1, BUFFER_SIZE, stream)) != 0) {
        if (!MD5_Update(&md5Context, buffer, bytesRead)) {
            fprintf(stderr, "Error: MD5_Update failed.\n");
            exit(EXIT_FAILURE);
        }
    }

    if (ferror(stream)) {
        fprintf(stderr, "Error reading from %s: %s\n", stream_name, strerror(errno));
        fclose(stream);
        exit(EXIT_FAILURE);
    }

    if (!MD5_Final(hash, &md5Context)) {
        fprintf(stderr, "Error: MD5_Final failed.\n");
        exit(EXIT_FAILURE);
    }
}

int main(int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "Usage: %s <filepath1> <filepath2>\n", argv[0]);
        return EXIT_FAILURE;
    }

    unsigned char hash1[MD5_DIGEST_LENGTH];
    unsigned char hash2[MD5_DIGEST_LENGTH];

    const char *filepath1 = argv[1];
    const char *filepath2 = argv[2];

    FILE *file1 = fopen(filepath1, "rb");
    if (file1 == NULL) {
        fprintf(stderr, "Error: Cannot open file '%s': %s\n", filepath1, strerror(errno));
        return EXIT_FAILURE;
    }
    calculate_md5_stream(file1, filepath1, hash1);
    fclose(file1);

    printf("File 1 (%s): ", filepath1);
    print_hash(hash1, MD5_DIGEST_LENGTH);
    printf("\n");

    FILE *file2 = fopen(filepath2, "rb");
    if (file2 == NULL) {
        fprintf(stderr, "Error: Cannot open file '%s': %s\n", filepath2, strerror(errno));
        return EXIT_FAILURE;
    }
    calculate_md5_stream(file2, filepath2, hash2);
    fclose(file2);


    printf("File 2 (%s): ", filepath2);
    print_hash(hash2, MD5_DIGEST_LENGTH);
    printf("\n");

    printf("----------------------------------------\n");
    if (memcmp(hash1, hash2, MD5_DIGEST_LENGTH) == 0) {
        printf("Result: The files are identical.\n");
    } else {
        printf("Result: The files are different.\n");
    }

    return EXIT_SUCCESS;
}

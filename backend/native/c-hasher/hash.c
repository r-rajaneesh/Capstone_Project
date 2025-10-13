#include <stdio.h>
#include <stdlib.h>
#include <string.h>   // <-- ADD THIS LINE
#include <errno.h>    // For the errno variable
#include <openssl/md5.h>

#define BUFFER_SIZE 8192

// Function to calculate MD5 from a file stream (like a file or stdin)
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

    // Check for read errors, as fread returns 0 on both EOF and error
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
    unsigned char hash[MD5_DIGEST_LENGTH];

    if (argc > 2) {
        fprintf(stderr, "Usage: %s [filepath]\n", argv[0]);
        return EXIT_FAILURE;
    }

    if (argc == 2) {
        const char *filepath = argv[1];
        FILE *file = fopen(filepath, "rb");
        if (file == NULL) {
            fprintf(stderr, "Error: Cannot open file '%s': %s\n", filepath, strerror(errno));
            return EXIT_FAILURE;
        }
        calculate_md5_stream(file, filepath, hash);
        fclose(file);
    } else {
        calculate_md5_stream(stdin, "stdin", hash);
    }

    for (int i = 0; i < MD5_DIGEST_LENGTH; i++) {
        printf("%02x", hash[i]);
    }
    printf("\n");

    return EXIT_SUCCESS;
}

#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <iomanip>
#include <system_error>
#include <openssl/md5.h>
#include <cerrno>

using namespace std;
constexpr size_t BUFFER_SIZE = 8192;

void calculate_md5(istream& stream, vector<unsigned char>& hash) {
    hash.resize(MD5_DIGEST_LENGTH);
    MD5_CTX md5Context;

    if (!MD5_Init(&md5Context)) {
        cerr << "Error: MD5_Init failed." << endl;
        exit(EXIT_FAILURE);
    }

    vector<char> buffer(BUFFER_SIZE);

    // CORRECTED LOOP: This is the standard, robust way to read a file.
    // It continues as long as the read operation succeeds OR the last attempt read some bytes.
    while (stream.read(buffer.data(), buffer.size()) || stream.gcount() > 0) {
        if (!MD5_Update(&md5Context, buffer.data(), stream.gcount())) {
            cerr << "Error: MD5_Update failed." << endl;
            exit(EXIT_FAILURE);
        }
    }

    if (stream.bad()) {
        cerr << "Error reading from stream: " << system_category().message(errno) << endl;
        exit(EXIT_FAILURE);
    }

    if (!MD5_Final(hash.data(), &md5Context)) {
        cerr << "Error: MD5_Final failed." << endl;
        exit(EXIT_FAILURE);
    }
}

void print_hash(const vector<unsigned char>& hash) {
    cout << hex << setfill('0');
    for (const auto& byte : hash) {
        cout << setw(2) << static_cast<int>(byte);
    }
    cout << endl;
}

int main(int argc, char* argv[]) {
    if (argc > 2) {
        cerr << "Usage: " << argv[0] << " [filepath]" << endl;
        return EXIT_FAILURE;
    }

    vector<unsigned char> hash;

    if (argc == 2) {
        string filepath = argv[1];
        ifstream file(filepath, ios::binary);
        if (!file.is_open()) {
            cerr << "Error: Cannot open file '" << filepath << "': "
                      << system_category().message(errno) << endl;
            return EXIT_FAILURE;
        }
        calculate_md5(file, hash);
    } else {
        #ifdef _WIN32
            #include <io.h>
            #include <fcntl.h>
            _setmode(_fileno(stdin), _O_BINARY);
        #endif
        calculate_md5(cin, hash);
    }

    print_hash(hash);

    return EXIT_SUCCESS;
}

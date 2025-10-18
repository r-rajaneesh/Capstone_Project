#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <iomanip>
#include <system_error>
#include <openssl/evp.h> // Use the modern EVP API
#include <cerrno>

// Use the standard namespace as requested
using namespace std;

// Use a constant for the buffer size for better readability
constexpr size_t BUFFER_SIZE = 8192;

/**
 * @brief Calculates the MD5 hash of an input stream using the modern OpenSSL EVP API.
 * @param stream The input stream to read from (e.g., a file stream).
 * @param hash A vector to store the resulting MD5 hash.
 * @return True on success, false on failure.
 */
bool calculate_md5(istream& stream, vector<unsigned char>& hash) {
    // EVP (Envelope) is the modern, recommended API for hashing in OpenSSL
    EVP_MD_CTX *md_context = EVP_MD_CTX_new();
    if (md_context == nullptr) {
        cerr << "Error: EVP_MD_CTX_new failed." << endl;
        return false;
    }

    // Initialize the digest operation for MD5
    if (EVP_DigestInit_ex(md_context, EVP_md5(), nullptr) != 1) {
        cerr << "Error: EVP_DigestInit_ex failed." << endl;
        EVP_MD_CTX_free(md_context);
        return false;
    }

    vector<char> buffer(BUFFER_SIZE);
    while (stream.read(buffer.data(), buffer.size()) || stream.gcount() > 0) {
        // Update the digest with the data chunk
        if (EVP_DigestUpdate(md_context, buffer.data(), stream.gcount()) != 1) {
            cerr << "Error: EVP_DigestUpdate failed." << endl;
            EVP_MD_CTX_free(md_context);
            return false;
        }
    }

    // Check for a non-EOF stream error
    if (stream.bad()) {
        cerr << "Error reading from stream: " << system_category().message(errno) << endl;
        EVP_MD_CTX_free(md_context);
        return false;
    }

    unsigned int digest_len;
    hash.resize(EVP_MAX_MD_SIZE); // Allocate enough space for any hash

    // Finalize the digest, getting the hash and its length
    if (EVP_DigestFinal_ex(md_context, hash.data(), &digest_len) != 1) {
        cerr << "Error: EVP_DigestFinal_ex failed." << endl;
        EVP_MD_CTX_free(md_context);
        return false;
    }

    hash.resize(digest_len); // Resize the vector to the actual hash length

    // Clean up the context
    EVP_MD_CTX_free(md_context);
    return true;
}

/**
 * @brief Prints a hash vector to the console in hexadecimal format.
 * @param hash The vector of unsigned chars representing the hash.
 */
void print_hash(const vector<unsigned char>& hash) {
    cout << hex << setfill('0');
    for (const auto& byte : hash) {
        cout << setw(2) << static_cast<int>(byte);
    }
}

int main(int argc, char* argv[]) {
    // The program now requires exactly two file paths as arguments.
    if (argc != 3) {
        cerr << "Usage: " << argv[0] << " <filepath1> <filepath2>" << endl;
        return EXIT_FAILURE;
    }

    string filepath1 = argv[1];
    string filepath2 = argv[2];

    vector<unsigned char> hash1;
    vector<unsigned char> hash2;

    // Process the first file
    {
        ifstream file1(filepath1, ios::binary);
        if (!file1.is_open()) {
            cerr << "Error: Cannot open file '" << filepath1 << "': "
                 << system_category().message(errno) << endl;
            return EXIT_FAILURE;
        }
        if (!calculate_md5(file1, hash1)) {
            cerr << "Failed to calculate hash for " << filepath1 << endl;
            return EXIT_FAILURE;
        }
    }

    // Process the second file
    {
        ifstream file2(filepath2, ios::binary);
        if (!file2.is_open()) {
            cerr << "Error: Cannot open file '" << filepath2 << "': "
                 << system_category().message(errno) << endl;
            return EXIT_FAILURE;
        }
        if (!calculate_md5(file2, hash2)) {
            cerr << "Failed to calculate hash for " << filepath2 << endl;
            return EXIT_FAILURE;
        }
    }

    // Print the hashes
    cout << "File 1 (" << filepath1 << "): ";
    print_hash(hash1);
    cout << endl;

    cout << "File 2 (" << filepath2 << "): ";
    print_hash(hash2);
    cout << endl;
    cout << "----------------------------------------" << endl;

    // Compare the hashes and print the result
    if (hash1 == hash2) {
        cout << "Result: The files are identical." << endl;
    } else {
        cout << "Result: The files are different." << endl;
    }

    return EXIT_SUCCESS;
}


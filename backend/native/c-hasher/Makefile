CC = gcc
CFLAGS = -Wall -Wextra -std=c99
LIBS = -lssl -lcrypto
TARGET = hash-c
SOURCE = hash.c

$(TARGET): $(SOURCE)
	$(CC) $(CFLAGS) -o $(TARGET) $(SOURCE) $(LIBS)

clean:
	rm -f $(TARGET)

install: $(TARGET)
	mkdir -p ../../bin
	cp $(TARGET) ../../bin/

.PHONY: clean install

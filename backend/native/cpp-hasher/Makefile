CXX = g++
CXXFLAGS = -Wall -Wextra -std=c++17
LIBS = -lssl -lcrypto
TARGET = hash-cpp
SOURCE = hash.cpp

$(TARGET): $(SOURCE)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCE) $(LIBS)

clean:
	rm -f $(TARGET)

install: $(TARGET)
	mkdir -p ../../bin
	cp $(TARGET) ../../bin/

.PHONY: clean install

/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
package org.graylog2.cluster.certificates;

import com.mongodb.client.MongoCollection;
import org.bson.Document;
import org.graylog.security.certutil.keystore.storage.location.KeystoreMongoLocation;
import org.graylog.testing.mongodb.MongoDBInstance;
import org.graylog2.database.MongoConnection;
import org.graylog2.security.encryption.EncryptedValueService;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import java.util.Optional;

import static org.graylog.security.certutil.keystore.storage.location.KeystoreMongoCollections.DATA_NODE_KEYSTORE_COLLECTION;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class CertificatesServiceTest {

    @Rule
    public final MongoDBInstance mongodb = MongoDBInstance.createForClass();

    private CertificatesService certificatesService;
    private EncryptedValueService encryptedValueService;
    private MongoConnection mongoConnection;


    @Before
    public void setUp() {
        mongoConnection = mongodb.mongoConnection();
        encryptedValueService = new EncryptedValueService("abracadabra! abracadabra!");
        certificatesService = new CertificatesService(mongoConnection, encryptedValueService);
    }

    @Test
    public void testReadUnExisting() {
        final Optional<String> result = certificatesService.readCert(
                new KeystoreMongoLocation("there is no node with this id", DATA_NODE_KEYSTORE_COLLECTION));
        assertTrue(result.isEmpty());
    }

    @Test
    public void testReadAndWrite() {
        boolean writeResult = certificatesService.writeCert(new KeystoreMongoLocation("node_id_1", DATA_NODE_KEYSTORE_COLLECTION), "Certificate string representation");
        assertTrue(writeResult);
        final Optional<String> readResult = certificatesService.readCert(new KeystoreMongoLocation("node_id_1", DATA_NODE_KEYSTORE_COLLECTION));
        assertTrue(readResult.isPresent());
        assertEquals("Certificate string representation", readResult.get());
    }

    @Test
    public void testHasCertReturnsFalseWhenNoMongoEntry() {
        assertFalse(certificatesService.hasCert(
                new KeystoreMongoLocation("there is no node with this id", DATA_NODE_KEYSTORE_COLLECTION)
        ));
    }

    @Test
    public void testHasCertReturnsFalseWhenMongoEntryWithMissingCert() {
        //adding document without encrypted certificate
        final MongoCollection<Document> collection = mongoConnection.getMongoDatabase().getCollection(DATA_NODE_KEYSTORE_COLLECTION.collectionName());
        collection.insertOne(new Document(DATA_NODE_KEYSTORE_COLLECTION.identifierField(), "node_id_1"));
        assertFalse(certificatesService.hasCert(
                new KeystoreMongoLocation("node_id_1", DATA_NODE_KEYSTORE_COLLECTION)
        ));
    }

    @Test
    public void testHasCertReturnsTrueWhenProperMongoEntry() {
        certificatesService.writeCert(new KeystoreMongoLocation("node_id_1", DATA_NODE_KEYSTORE_COLLECTION), "Certificate string representation");
        assertTrue(certificatesService.hasCert(
                new KeystoreMongoLocation("node_id_1", DATA_NODE_KEYSTORE_COLLECTION)
        ));
    }


}

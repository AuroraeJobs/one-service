package org.aurorae.tsdb.hbase.dao;

import org.apache.hadoop.hbase.client.Result;

public interface HBaseResultExecutor {

	void exe(Result row);
}

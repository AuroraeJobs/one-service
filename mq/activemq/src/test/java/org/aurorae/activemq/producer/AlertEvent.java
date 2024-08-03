package org.aurorae.activemq.producer;

import java.io.Serializable;
import java.util.Arrays;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * 引起告警的 事件对象
 */
public class AlertEvent implements Serializable, Cloneable {
	/**
	 * 常量： 未知级别
	 */
	public static final int SEV_UNKNOWN = -2;
	/**
	 * 常量： 正常级别
	 */
	public static final int SEV_NORMAL = -1;
	/**
	 * 常量: 提示信息级别
	 */
	public static final int SEV_INFO = 0;
	/**
	 * 常量: 警告信息级别
	 */
	public static final int SEV_WARNING = 1;
	/**
	 * 常量: 次要级别
	 */
	public static final int SEV_MINOR = 2;
	/**
	 * 常量：重要级别
	 */
	public static final int SEV_MAJOR = 3;
	/**
	 * 常量: 紧急级别
	 */
	public static final int SEV_CRITICAL  = 4;
	
	/**
	 * 序列化版本ID
	 */
	private static final long serialVersionUID = 2974632271317010285L;
	/**
	 * 事件id
	 */
	protected long eventId;			
	/**
	 * 告警记录id
	 */
	protected long alertId; 		
	/**
	 * 事件原始id
	 */
	protected String srcEventId; 	
	/**
	 * 告警类型id
	 */
	protected long alertCode;		
	/**
	 * 节点id
	 */
	protected long nodeId; 			
	/**
	 * 节点所属的域，以','分隔，首要域在第一个
	 */
	protected String domains;		
	/**
	 * 节点所属的类型，以','分隔，首要类型在第一个
	 */
	protected String nodeTypes;		
	/**
	 * 设备名称
	 */
	protected String devName;		
	/**
	 * 应用名称
	 */
	protected String appName;		
	/**
	 * 辅助节点id
	 */
	protected long relatedNodeId; 	
	/**
	 * 实例关键词
	 */
	protected String instance;		
	/**
	 * 实例关键词2
	 * 存储设备的扩展域
	 */
	protected String instance2;		
	/**
	 * 关联KPI值
	 */
	protected Object kpiValue; 		
	/**
	 * 关联KPI Code
	 */
	protected long kpiCode;			
	/**
	 * 关联KPI单位
	 */
	protected String kpiUnit;		
	/**
	 * 严重级别
	 */
	protected int severity; 		
	/**
	 * 事件标题
	 */
	protected String title;  		
	/**
	 * 事件信息
	 */
	protected String message; 		
	/**
	 * 告警发生时间
	 */
	protected Date arisingTime;		
	/**
	 * 告警接收时间
	 */
	protected Date receiveTime;		
	/**
	 * 采集系统id
	 */
	protected String agentId;		
	/**
	 * 是否已过滤
	 */
	protected boolean filtered;		
	/**
	 * 标签
	 */
	protected String tags;			
	/**
	 * 是否已分类
	 */
	protected boolean classified;	
	/**
	 * 域，数组形式
	 */
	private String[] domainList;
	/**
	 * 节点类型,数组形式
	 */
	private String[] nodeTypeList;
	/**
	 * 关键词标签，数组形式
	 */
	private String[] tagList;

	//告警规则名称
	private String thresholdTitle;

	public static String getSeverityName(int code) {
		switch(code) {
			case SEV_NORMAL: return "normal";
			case SEV_INFO: return "info";
			case SEV_WARNING: return "warning";
			case SEV_MINOR: return "minor";
			case SEV_MAJOR: return "major";
			case SEV_CRITICAL: return "critical";
			default: return "unknown";
		}
	}
	
	public AlertEvent() {
		eventId = 8752864331268344897L;
		receiveTime = new Date();
	}
	
	public AlertEvent(AlertEvent event) {
		eventId = event.eventId;
		srcEventId = event.srcEventId;
		alertCode = event.alertCode;
		nodeId = event.nodeId;
		domains = event.domains;
		nodeTypes = event.nodeTypes;
		devName = event.devName;
		appName = event.appName;
		relatedNodeId = event.relatedNodeId;
		instance = event.instance;
		instance2 = event.instance2;
		kpiValue = event.kpiValue;
		kpiCode = event.kpiCode;
		kpiUnit = event.kpiUnit;
		severity = event.severity;
		title = event.title;
		message = event.message;
		arisingTime = event.arisingTime;
		receiveTime = event.receiveTime;
		agentId = event.agentId;
		alertId = event.alertId;
		filtered = event.filtered;
		tags = event.tags;
		classified = event.classified;
		thresholdTitle = event.thresholdTitle;
	}
	

	
	public boolean isClassified() {
		return classified;
	}

	public void setClassified(boolean classified) {
		this.classified = classified;
	}

	public String[] getDomainList() {
		if(null == domains)
			domainList = null;
		else if(null == domainList) {
			domainList = domains.split("[,;/]");
			if(domainList.length>0 && domainList[0].length()==0)
				domainList = Arrays.copyOfRange(domainList, 1, domainList.length);
		}
		return domainList;
	}

	public String[] getNodeTypeList() {
		if(null == nodeTypes)
			nodeTypeList = null;
		else if(null == nodeTypeList) {
			nodeTypeList = nodeTypes.split("[,;/]");
			if(nodeTypeList.length>0 && nodeTypeList[0].length()==0)
				nodeTypeList = Arrays.copyOfRange(nodeTypeList, 1, nodeTypeList.length);
		}
		return nodeTypeList;
	}

	public long getEventId() {
		return eventId;
	}
	public void setEventId(long eventId) {
		this.eventId = eventId;
	}
	
	public long getNodeId() {
		return nodeId;
	}
	public void setNodeId(long nodeId) {
		this.nodeId = nodeId;
	}

	public String getDomains() {
		return domains;
	}

	public void setDomains(String domains) {
		if(null == domains || domains.equals(this.domains))
			return;
		this.domains = domains;
		domainList = null;
	}

	public String getNodeTypes() {
		return nodeTypes;
	}

	public void setNodeTypes(String nodeTypes) {
		if(null == nodeTypes || nodeTypes.equals(this.nodeTypes))
			return;
		this.nodeTypes = nodeTypes;
		nodeTypeList = null;
	}

	public String getDevName() {
		return devName;
	}

	public void setDevName(String devName) {
		this.devName = devName;
	}

	public String getAppName() {
		return appName;
	}

	public void setAppName(String appName) {
		this.appName = appName;
	}

	public int getSeverity() {
		return severity;
	}
	public void setSeverity(int severity) {
		this.severity = severity;
	}
	
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	
	public String getMessage() {
		return message;
	}
	public void setMessage(String message) {
		this.message = message;
	}
	
	public Date getArisingTime() {
		return arisingTime;
	}
	public void setArisingTime(Date arisingTime) {
		this.arisingTime = arisingTime;
	}
	
    public long getAlertCode() {
        return alertCode;
    }
    public void setAlertCode(long alertCode) {
        this.alertCode = alertCode;
    }

	public String getInstance() {
		return instance;
	}
	public void setInstance(String instance) {
		this.instance = instance;
	}
	
	public String getInstance2() {
		return instance2;
	}

	public void setInstance2(String instance2) {
		this.instance2 = instance2;
	}

	public long getRelatedNodeId() {
		return relatedNodeId;
	}
	public void setRelatedNodeId(long relatedNodeId) {
		this.relatedNodeId = relatedNodeId;
	}
	
    public long getAlertId() {
        return alertId;
    }
    public void setAlertId(long alertId) {
        this.alertId = alertId;
    }
    
	public String getSrcEventId() {
		return srcEventId;
	}
	public void setSrcEventId(String srcEventId) {
		this.srcEventId = srcEventId;
	}
	
	public boolean isFiltered() {
		return filtered;
	}

	public void setFiltered(boolean filtered) {
		this.filtered = filtered;
	}

	public Date getReceiveTime() {
		return receiveTime;
	}

	public void setReceiveTime(Date receiveTime) {
		this.receiveTime = receiveTime;
	}

	public String getAgentId() {
		return agentId;
	}
	
	public void setAgentId(String agentId) {
		this.agentId = agentId;
	}
	
	public Object getKpiValue() {
		return kpiValue;
	}

	public void setKpiValue(Object kpiValue) {
		this.kpiValue = kpiValue;
	}

	public long getKpiCode() {
		return kpiCode;
	}

	public void setKpiCode(long kpiCode) {
		this.kpiCode = kpiCode;
	}

	public String getKpiUnit() {
		return kpiUnit;
	}

	public void setKpiUnit(String kpiUnit) {
		this.kpiUnit = kpiUnit;
	}

	public String getThresholdTitle() {
		return thresholdTitle;
	}

	public void setThresholdTitle(String thresholdTitle) {
		this.thresholdTitle = thresholdTitle;
	}

	public String[] getTagList() {
		if(null == tags)
			tagList = null;
		else if(null == tagList) {
			tagList = tags.split(",");
		}
		return tagList;
	}
	
	public String getTags() {
		return tags;
	}

	public void setTags(String tags) {
		this.tags = tags;
		tagList = null;
	}
	
	public void addTags(String aTags) {
		if(null == aTags || aTags.length()==0)
			return;
		if(null == tags)
			setTags(aTags);
		else {
			Set<String> set = new LinkedHashSet<String>();
			for(String tag : getTagList())
				set.add(tag);
			for(String tag : aTags.split(","))
				set.add(tag);
			StringBuilder sb = new StringBuilder();
			for(String tag : set) {
				if(sb.length()>0)
					sb.append(",");
				sb.append(tag);
			}
			setTags(sb.toString());
		}
	}

	public void removeTags(String aTags) {
		if(null == aTags || aTags.length()==0 || null == tags)
			return;
		Set<String> set = new LinkedHashSet<String>();
		for(String tag : getTagList())
			set.add(tag);
		for(String tag : aTags.split(","))
			set.remove(tag);
		StringBuilder sb = new StringBuilder();
		for(String tag : set) {
			if(sb.length()>0)
				sb.append(",");
			sb.append(tag);
		}
		setTags(sb.toString());
	}

	public long age() {
		if(null == arisingTime)
			return 0;
		long current = System.currentTimeMillis();
		if(current > arisingTime.getTime())
			return current - arisingTime.getTime();
		return 0;
	}
	
	@Override
	public boolean equals(Object event) {
		if(null == event || !(event instanceof AlertEvent))
			return false;
		return ((AlertEvent)event).getEventId() == eventId;
	}
	
	@Override
	public int hashCode() {
		if(eventId == 0)
			return super.hashCode();
		return (new Long(eventId)).hashCode();
	}
	
	@Override
	public AlertEvent clone() {
		return new AlertEvent(this);
	}
	
	@Override
	public String toString() {
		return "AlertEvent-" + eventId; 
	}
}
